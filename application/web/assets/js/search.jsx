import React from 'react';
import ReactDOM from 'react-dom';
import * as Searchkit from 'searchkit';
import TransactionListItem from './transactionListItem';
import DateRangeFilter from './dateRangeFilter';
import CollapsiblePanel from './collapsiblePanel';
import moment from 'moment';
import * as $ from 'jquery';

const SIZE = 10000;

export default class SearchApplication extends React.Component {


    constructor(props) {
        super(props);

        this.state = {
            keys: this.getAllKeyValuePairs()
        }

        const host = this.getHost(props.esHost);
        this.searchkit = new Searchkit.SearchkitManager(host);

        this.searchkit.translateFunction = (key)=> {
            return {"pagination.next":"Next Page", "pagination.previous":"Previous Page"}[key]
        };

        this.searchkit.addDefaultQuery(this.getDefaultQuery());
    }

    getAllKeyValuePairs() {
        const query = {
            query: {
                term: {
                    type: "keys"
                }
            },
            size: SIZE // Temporary to test the scroll logic
        };
        const keyArray = {};
        $.ajax({
            type:"POST",
            async: false,
            url: this.props.esHost + '/_search',
            data: JSON.stringify(query),
            contentType:'application/json'

        }).done((data) => {
            let hits = data.hits.hits;
            hits.forEach((hit)=> {
                if(hit._source && hit._source.keyword) {
                  var key = hit._source.keyword;
                  var display_name = hit._source.display_name;
                  if(!Object.keys(keyArray).includes(key)) {
                    keyArray[key] = {key, display_name};
                  }
                }
            });
        });
      return keyArray
    }

    getHost(host) {
        return host;
    }

    formatDateForDatePicker(date) {
        // convert to proper format for date picker component
        return moment(date).format("D MMM YYYY");
    }

    getOneYearFromToday() {
        return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    }

    getDefaultQuery() {
        const BoolMust = Searchkit.BoolMust;
        const TermQuery = Searchkit.TermQuery;

        return (query)=> {
            return query.addQuery( BoolMust([
                    TermQuery("type", "transactions"),
                ])
            )}

    }

    buildProjectIdQuery(e) {
      const BoolMust = Searchkit.BoolMust;
      const TermQuery = Searchkit.TermQuery;
      return BoolMust([
        TermQuery("projects.obj_id.keyword", `projects_${e}`),
      ])
    }

    componentDidUpdate () {
        // put code in here that happens after the component is refreshed
    }

    formatDateForElasticSearch(date) {
        // convert to proper format for search_date queries
        return moment(date).format("YYYY-MM-DDTHH:MM:SS");
    }

    decayingScoreQuery(scoreFunction, field, scale, origin, decay, query) {
        if(origin) {
            return {
                function_score: {
                    query: query,
                }
            }
        } else {
            return {
                function_score: {
                    query: query,
                }
            }
        }
    }

    buildPanels(panel, level) {
        const content = [];
        //Build child panels
        Object.keys(panel.panels).forEach((panelKey) => {
            content.push(this.buildPanels(panel.panels[panelKey], level+1));
        });
        //Build facets
        Object.keys(panel.facets).forEach((facetKey) => {
            content.push(panel.facets[facetKey]);
        });
        return (
            <div key={panel.panelTitle} className={"level_"+level}>
                <CollapsiblePanel key={panel.panelTitle} title={panel.panelTitle}>
                    {content}
                </CollapsiblePanel>
            </div>
        )
    }

    buildMetadataFacets(keys) {
        const panels = {facets: {}, panels: {}, panelTitle: 'In-Depth Metadata'};
        Object.keys(keys).forEach((key) => {
            let keyText = key;
            let panelToAdd = panels;
            keyText = key.split('.').pop();
            panelToAdd.facets[key] =(
                <Searchkit.RefinementListFilter
                    id={key}
                    key={key}
                    title={keyText.replace(/_/g, ' ').toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ')}
                    field={'key_value_pairs.key_value_hash.'+key+'.keyword'}
                    operator="AND"
                    size={10}
                    translations={{'': 'Not Specified'}}
                />
                );
        });
        return this.buildPanels(panels, 0);

    }

    render() {
        var informationText = 'To search multiple terms at once, insert "AND" between them. If a term contains a space, place the term in quotes';
        var TermQuery = Searchkit.TermQuery;

        const content = this.buildMetadataFacets(this.state.keys);

        return(
            <div>
                <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" />
                <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" />
                <Searchkit.SearchkitProvider searchkit={this.searchkit}>
                    <Searchkit.Layout size="1">
                        <Searchkit.TopBar>
                            <Searchkit.SearchBox
                                translations={{"searchbox.placeholder":"Search Datasets"}}
                                queryOptions={{"minimum_should_match":"95%"}}
                                queryBuilder={Searchkit.QueryString}
                                auotfocus={true}
                                searchOnChange={true}
                                queryFields={["_all"]}
                            />
                            <i
                            className="fas fa-info-circle fa-2x"
                            style={{marginLeft: '10px', marginTop: '5px', color: 'white'}}
                            datatoggle="tooltip"
                            title={informationText}
                            />
                        </Searchkit.TopBar>
                        <Searchkit.LayoutBody>
                            {/* Facets/Filters */}
                            <Searchkit.SideBar>
                                <CollapsiblePanel title="Dataset">
                                    <Searchkit.RefinementListFilter
                                        id="release_data"
                                        title="Is Released"
                                        field="release"
                                        operator="AND"
                                        translations={{"true": "Released Data", "false": "Private Data"}}
                                    />
                                    <Searchkit.RefinementListFilter
                                        id="doi"
                                        title="Has Data DOI"
                                        field="has_doi"
                                        operator="AND"
                                        translations={{"true": "Yes", "false": "No"}}
                                    />
                                    <DateRangeFilter
                                        id="created_date"
                                        field="created_date"
                                        queryDateFormat="YYYY-MM-DDTHH:MM:SS"
                                        title="Upload Date"
                                        startDate={"1 Jan 2010"}
                                        endDate={this.formatDateForDatePicker(this.getOneYearFromToday())}
                                    />
                                </CollapsiblePanel>
                                <hr />

                                <CollapsiblePanel title="Institution">
                                    <Searchkit.RefinementListFilter
                                        id="institution"
                                        title="Institution Name"
                                        field="institutions.keyword"
                                        operator="AND"
                                        size={10}
                                    />
                                </CollapsiblePanel>
                                <hr />

                                <CollapsiblePanel title="Instruments" >
                                    <Searchkit.RefinementListFilter
                                        id="instruments"
                                        title="Instruments Name"
                                        field="instruments.keyword"
                                        operator="OR"
                                        size={10}
                                    />
                                </CollapsiblePanel>
                                <hr />

                                <CollapsiblePanel title="Instrument Groups" >
                                    <Searchkit.RefinementListFilter
                                        id="groups"
                                        title="Group Name"
                                        field="groups.keyword"
                                        operator="OR"
                                        size={10}
                                    />
                                </CollapsiblePanel>
                                <hr />

                                <CollapsiblePanel title="People" >
                                    {/* PROJECT TEAM MEMBER FILTER */}
                                    <Searchkit.RefinementListFilter
                                        id="submitter"
                                        title="Staff Scientists"
                                        field="users.submitter.keyword"
                                        operator="OR"
                                        size={10}
                                        translations={
                                            {
                                                "svc-dms, svc-dms ": "Mass Spec Uploader",
                                                "svc-nmr1, svc-nmr1 ": "NMR Uploader",
                                                "svc-quiet1, svc-quiet1 ": "Microscopy Uploader",

                                            }
                                        }
                                    />
                                    <Searchkit.RefinementListFilter
                                        id="releaser"
                                        title="Authorized Releaser"
                                        field="users.authorized_releaser.keyword"
                                        operator="OR"
                                        size={10}
                                        translations={
                                            {
                                                "svc-dms, svc-dms ": "Mass Spec Uploader",
                                                "svc-nmr1, svc-nmr1 ": "NMR Uploader",
                                                "svc-quiet1, svc-quiet1 ": "Microscopy Uploader",

                                            }
                                        }
                                    />
                                </CollapsiblePanel>
                                <hr />

                                <CollapsiblePanel title="Projects" >
                                    <Searchkit.InputFilter
                                        id="project_id_search"
                                        title="Project ID Filter"
                                        placeholder="Enter project ID"
                                        searchOnChange={true}
                                        queryBuilder={this.buildProjectIdQuery.bind(this)}
                                        queryFields={["projects.obj_id.keyword"]}
                                    />
                                    <DateRangeFilter
                                        id="projects.actual_start_date"
                                        field="projects.actual_start_date"
                                        queryDateFormat="YYYY-MM-DD"
                                        title="Start Date"
                                        startDate={"1 Jan 2002"}
                                        endDate={this.formatDateForDatePicker(this.getOneYearFromToday())}
                                    />
                                    <DateRangeFilter
                                        id="projects.actual_end_date"
                                        field="projects.actual_end_date"
                                        queryDateFormat="YYYY-MM-DD"
                                        title="End Date"
                                        startDate={"1 Jan 2002"}
                                        endDate={this.formatDateForDatePicker(this.getOneYearFromToday())}
                                    />
                                    <Searchkit.RefinementListFilter
                                        id="project_title"
                                        title="Project Title"
                                        field="projects.keyword"
                                        operator="OR"
                                        size={10}
                                    />
                                </CollapsiblePanel>
                                <hr />
                                <CollapsiblePanel title="Capability">
                                    <Searchkit.RefinementListFilter
                                        id="science_theme"
                                        title="Science Theme"
                                        field="science_themes.keyword"
                                        operator="OR"
                                        size={10}
                                    />
                                </CollapsiblePanel>
                                <hr />

                                {Object.keys(this.state.keys).length > 0 && (
                                    <div>
                                        {content}
                                    </div>
                                )}
                            </Searchkit.SideBar>
                            <Searchkit.LayoutResults>
                                <Searchkit.ActionBarRow>
                                    <Searchkit.HitsStats translations={{"hitstats.results_found":"{hitCount} results found"}}/>
                                </Searchkit.ActionBarRow>
                                <Searchkit.ActionBarRow>
                                    <Searchkit.SelectedFilters
                                        translations={{
                                            "End Date":"Proposal End Date",
                                            "Start Date":"Proposal Start Date",
                                            "Upload Date":"Dataset Upload Date",
                                            "User Name":"Dataset Author"
                                        }}
                                    />
                                    <Searchkit.ResetFilters />
                                </Searchkit.ActionBarRow>
                                <Searchkit.Hits
                                    hitsPerPage={15}
                                    itemComponent={TransactionListItem}
                                    scrollTo="body"
                                />
                                <Searchkit.Pagination showNumbers={true} />
                            </Searchkit.LayoutResults>
                        </Searchkit.LayoutBody>
                    </Searchkit.Layout>
                </Searchkit.SearchkitProvider>
            </div>
        );
    }
}

window.startSearchApp = function(esHost) {
    ReactDOM.render(<SearchApplication esHost={esHost} {...this.props} />, document.getElementById('searchkit_section'));
};