import React from 'react';
import ReactDOM from 'react-dom';
import * as Searchkit from 'searchkit';
import TransactionListItem from './transactionListItem';
import DateRangeFilter from './dateRangeFilter';
import CollapsiblePanel from './collapsiblePanel';
import moment from 'moment';
import * as $ from 'jquery';

const SIZE = 10000; // Good enough for the initial development

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
            _source: [
                "key_value_pairs.key_value_objs.key"
            ],
            query: {
                term: {
                    _type: "transactions"
                }
            },
            size: SIZE // Temporary to test the scroll logic
        };
        const keyArray = [];
        $.ajax({
            type:"POST",
            async: false,
            url: this.props.esHost + '/_search?scroll=1m',
            data: JSON.stringify(query),
            contentType:'application/json'

        }).done((data) => {
            const scrollId = data._scroll_id;
            const hits = data.hits.hits;
            let finished = data.hits.hits.length !== SIZE;

            //TODO: Temporary fix until we have the scroll capability enabled
            finished = true;
            const followUpQuery = {
                scroll: '1m',
                scroll_id: scrollId
            };
            while (!finished) {
                $.ajax({
                    type:"POST",
                    async: false,
                    url: this.props.esHost + '/_search/scroll',
                    data: JSON.stringify(followUpQuery),
                    contentType:'application/json'
                }).done((scrollData) => {
                    console.log('scrollData', scrollData);
                    finished = true;
                });
                // TODO: TEMPORARY FIX UNTIL WE HAVE THE SCROLL CAPABILITY ENABLED
                finished = true;
            }
            // if the number of hits is equal to the size, store what we have and then query to /_search/scroll with the body
            // {scroll:1m, scroll_id: <scroll ID from result>}
            // Add the results to the existing map/store
            hits.forEach((hit)=> {
                if(hit._source && hit._source.key_value_pairs && hit._source.key_value_pairs.key_value_objs) {
                    hit._source.key_value_pairs.key_value_objs.forEach((key) => {
                        if (!keyArray.includes(key.key)) {
                            keyArray.push(key.key);
                        }
                    });
                }
            });
        });
        return keyArray.sort();
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
        const MatchQuery = Searchkit.MatchQuery;
        const FilteredQuery = Searchkit.FilteredQuery;

        const instance = this;
        return (query)=> {
            return query.addQuery( BoolMust([
                    TermQuery("_type", "transactions"),
                ])
            )}

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
        keys.forEach((key) => {
            let keyText = key;
            let panelToAdd = panels;
            while(keyText.includes('.')) {
                const panelText = keyText.slice(0, keyText.indexOf('.'));
                if(!panelToAdd.panels[panelText]) {
                    panelToAdd.panels[panelText] = {
                        panelTitle: panelText.replace(/_/g,' ').toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' '),
                        facets: {},
                        panels: {}
                    }
                }
                panelToAdd = panelToAdd.panels[panelText];
                keyText = keyText.slice(keyText.indexOf('.')+1)
            }
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
                                        translations={{"true": "Released Data", "false": "Proprietary Data"}}
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
                                        id="instrument_groups"
                                        title="Group Name"
                                        field="instrument_groups.keyword"
                                        operator="OR"
                                        size={10}
                                    />
                                </CollapsiblePanel>
                                <hr />

                                <CollapsiblePanel title="Users" >
                                    <Searchkit.RefinementListFilter
                                        id="users"
                                        title="User Name"
                                        field="users.keyword"
                                        operator="OR"
                                        size={10}
                                    />
                                </CollapsiblePanel>
                                <hr />

                                <CollapsiblePanel title="Proposals" >
                                    <DateRangeFilter
                                        id="proposals.actual_start_date"
                                        field="proposals.actual_start_date"
                                        queryDateFormat="YYYY-MM-DD"
                                        title="Start Date"
                                        startDate={"1 Jan 2002"}
                                        endDate={this.formatDateForDatePicker(this.getOneYearFromToday())}
                                    />
                                    <DateRangeFilter
                                        id="proposals.actual_end_date"
                                        field="proposals.actual_end_date"
                                        queryDateFormat="YYYY-MM-DD"
                                        title="End Date"
                                        startDate={"1 Jan 2002"}
                                        endDate={this.formatDateForDatePicker(this.getOneYearFromToday())}
                                    />
                                    <Searchkit.RefinementListFilter
                                        id="proposals"
                                        title="Proposal Title"
                                        field="proposals.keyword"
                                        operator="OR"
                                        size={10}
                                    />
                                </CollapsiblePanel>
                                <hr />

                                {this.state.keys.length > 0 && (
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