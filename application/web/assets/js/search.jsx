import React from 'react';
import ReactDOM from 'react-dom';
import * as Searchkit from 'searchkit';
import TransactionListItem from './transactionListItem';
import DateRangeFilter from './dateRangeFilter';
import moment from 'moment';

export default class SearchApplication extends React.Component {

    constructor(props) {
        super(props);

        const host = this.getHost(props.esHost);
        this.searchkit = new Searchkit.SearchkitManager(host);

        this.searchkit.translateFunction = (key)=> {
            return {"pagination.next":"Next Page", "pagination.previous":"Previous Page"}[key]
        };

        this.searchkit.addDefaultQuery(this.getDefaultQuery());
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

    formatDateForDatePicker(date) {
        // convert to proper format for date picker component
        return moment(date).format("D MMM YYYY");
    }

    formatDateForElasticSearch(date) {
        // convert to proper format for search_date queries
        return moment(date).format("YYYY-MM-DD");
    }

    getOneYearFromToday() {
        return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
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

    render() {
        var informationText = 'To search multiple terms at once, insert "AND" between them. If a term contains a space, place the term in quotes';
        var TermQuery = Searchkit.TermQuery;
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
                                <Searchkit.RefinementListFilter
                                    id="release_data"
                                    title="Is Released"
                                    field="release"
                                    operator="AND"
                                    translations={{"true": "Released Data", "false": "Proprietary Data"}}
                                />
                                {/*
                                <DateRangeFilter
                                    id="upload_date"
                                    field="upload_date"
                                    queryDateFormat="YYYY-MM-DD"
                                    title="Upload Date"
                                    startDate={"1 Jan 1986"}
                                    endDate={this.formatDateForDatePicker(this.getOneYearFromToday())}
                                />
                                */}
                                <Searchkit.RefinementListFilter
                                    id="institution"
                                    title="Institutions"
                                    field="institutions.keyword"
                                    operator="AND"
                                    size={10}
                                />
                                <Searchkit.RefinementListFilter
                                    id="instruments"
                                    title="Instruments"
                                    field="instruments.keyword"
                                    operator="AND"
                                    size={10}
                                />
                                <Searchkit.RefinementListFilter
                                    id="instrument_groups"
                                    title="Instrument Groups"
                                    field="instrument_groups.keyword"
                                    operator="AND"
                                    size={10}
                                />
                                <Searchkit.RefinementListFilter
                                    id="users"
                                    title="Users"
                                    field="users.keyword"
                                    operator="AND"
                                    size={10}
                                />
                                <Searchkit.RefinementListFilter
                                    id="proposals"
                                    title="Proposals"
                                    field="proposals.keyword"
                                    operator="AND"
                                    size={10}
                                />
                                <Searchkit.RefinementListFilter
                                    id="theme"
                                    title="Science Themes"
                                    field="science_themes.keyword"
                                    operator="AND"
                                    size={10}
                                />
                            </Searchkit.SideBar>
                            <Searchkit.LayoutResults>
                                <Searchkit.ActionBarRow>
                                    <Searchkit.HitsStats translations={{"hitstats.results_found":"{hitCount} results found"}}/>
                                </Searchkit.ActionBarRow>
                                <Searchkit.ActionBarRow>
                                    <Searchkit.SelectedFilters />
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