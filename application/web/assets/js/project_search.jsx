import React from 'react';
import * as Searchkit from 'searchkit';
import ProjectListItem from './projectListItem';
import DateRangeFilter from './dateRangeFilter';
import CollapsiblePanel from './collapsiblePanel';
import moment from 'moment';
import * as $ from 'jquery';

const SIZE = 10000;

export default class ProjectSearch extends React.Component {
  static allProjectQuery;

  constructor(props) {
    super(props);

    this.state = {

    };

    const host = this.getHost(props.esHost);
    this.searchkit = new Searchkit.SearchkitManager(host, {
      timeout: 10000
    });

    console.log(this.searchkit, props);
    this.searchkit.translateFunction = (key) => {
      return {"pagination.next": "Next Page", "pagination.previous":"Previous Page"}[key]
    };

    this.searchkit.addDefaultQuery(this.getDefaultQuery());
    this.searchkit.setQueryProcessor((plainQueryObject) => {
      this.getAllProjectsQuery(JSON.parse(JSON.stringify(plainQueryObject)));
      return plainQueryObject;
    })
  }

  getAllProjectsQuery(query) {
    query.size = SIZE;
    $.ajax({
      type:'POST',
      url: this.props.esHost+'/_search',
      data: JSON.stringify(query),
      contentType:'application/json'
    }).done((data) => {
      const projIds = data.hits.hits.map((result) => (result._id));
      this.props.updateProjsHandler(projIds);
    })
  }

  getHost(host) {
    return host;
  }

  formatDateForDatePicker(date) {
    // convert to proper format for date picker component
    return moment(date).format("D MMM YYYY");
  }

  getDefaultQuery() {
    const BoolMust = Searchkit.BoolMust;
    const TermQuery = Searchkit.TermQuery;

    return (query) => {
      return query.addQuery(
        BoolMust([
          TermQuery("type","projects"),
          {"script": {"script": "doc['transaction_ids'].length > 0"}}
        ])
      );
    };
  }

  getOneYearFromToday() {
    return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
  }

  render() {
    var informationText = "Temp";
    return (
      <div>
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" />
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" />
        <button onClick={this.props.showTransactionsHandler}>Show Transactions</button>
        <Searchkit.SearchkitProvider searchkit={this.searchkit}>
          <Searchkit.Layout size="1">
            <Searchkit.TopBar>
              <Searchkit.SearchBox
                translations={{"searchbox.placeholder":"Search projects"}}
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
                <CollapsiblePanel title="Project Facets">
                  <Searchkit.RefinementListFilter
                    id="released_project"
                    title="Is Released"
                    field="release"
                    operator="AND"
                    translations={{"true": "Released Project", "false": "Unreleased Project"}}
                  />

                  <DateRangeFilter
                    id="actual_start_date"
                    field="actual_start_date"
                    queryDateFormat="YYYY-MM-DD"
                    title="Start Date"
                    startDate={"1 Jan 2010"}
                    endDate={this.formatDateForDatePicker(this.getOneYearFromToday())}
                  />

                  <DateRangeFilter
                    id="actual_end_date"
                    field="actual_end_date"
                    queryDateFormat="YYYY-MM-DD"
                    title="End Date"
                    startDate={"1 Jan 2010"}
                    endDate={this.formatDateForDatePicker(this.getOneYearFromToday())}
                  />

                  {/*
                   <Searchkit.RefinementListFilter
                   id="project_members"
                   field="users.member_of.display_name"
                   title="Project Members"
                   operator="OR"
                   size={10}
                   />
                   */}
                </CollapsiblePanel>

                <hr />
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
                  itemComponent={ProjectListItem}
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