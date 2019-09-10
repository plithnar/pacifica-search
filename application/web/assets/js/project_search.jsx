import React from 'react';
import * as Searchkit from 'searchkit';
import ProjectListItem from './projectListItem';
import DateRangeFilter from './dateRangeFilter';
import CollapsiblePanel from './collapsiblePanel';
import moment from 'moment';
import * as $ from 'jquery';

const SIZE = 10000;

export default class ProjectSearch extends React.Component {
  constructor(props) {
    super(props);

    const host = this.getHost(props.esHost);
    this.searchkit = new Searchkit.SearchkitManager(host, {
      timeout: 10000
    });

    this.searchkit.translateFunction = (key) => {
      if(key.match(/projects_\d+/g)) {
        return key.replace('projects_', '#');
      }
      let translations = {
        "pagination.next":"Next Page",
        "pagination.previous":"Previous Page"
      };

      return translations[key]
    };

    this.searchkit.addDefaultQuery(this.getDefaultQuery());
  }

  getAllProjectsQuery(query) {
    query.size = SIZE; // Needs to set to a ludicrously high size so that we can get all the project IDs for the hits.
                       // By doing it like this we only have to query once.
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

  buildProjectIdQuery(e) {
    const BoolShould = Searchkit.BoolShould;

    return BoolShould([
      {"wildcard": {"obj_id.keyword": `*projects_${e}*`}},
      {"wildcard": {"title.keyword": `*${e}*`}}
    ])
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
        <Searchkit.SearchkitProvider searchkit={this.searchkit}>
          <Searchkit.Layout size="1">
            <Searchkit.TopBar>
              <Searchkit.SearchBox
                id="project_query"
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
                <CollapsiblePanel title="EMSL Projects">

                  <div style={{display: "none"}}>
                    <Searchkit.RefinementListFilter
                      id="project"
                      title="Project ID"
                      field="obj_id.keyword"
                      operator="AND"
                      size={10}
                    />
                  </div>
                  <Searchkit.InputFilter
                    id="project_id_search"
                    title="Project Filter"
                    placeholder="Project ID/Title"
                    searchOnChange={true}
                    queryBuilder={this.buildProjectIdQuery.bind(this)}
                    queryFields={["projects.obj_id.keyword"]}
                    prefixQueryFields={["projects.title.keyword"]}
                  />

                  <Searchkit.NumericRefinementListFilter
                    id="transaction_count"
                    title="# of Datasets"
                    field="transaction_count"
                    options={[
                      {title:"All"},
                      {title:"Up to 50", from:1, to:51},
                      {title:"51 to 400", from:51, to:401},
                      {title:"401 to 1000", from:401, to:1001},
                      {title:"More than 1000", from: 1001}
                    ]}
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
                </CollapsiblePanel>
                <hr />
                <CollapsiblePanel title="EMSL Users">
                  <Searchkit.RefinementListFilter
                    id="principal_investigator"
                    field="users.principle_investigator.keyword"
                    title="Principal Investigators"
                    operator="OR"
                    orderKey="_term"
                    size={10}
                  />
                  <Searchkit.RefinementListFilter
                    id="co_principal_investigator"
                    field="users.co_principle_investigator.keyword"
                    title="Co-Principal Investigators"
                    operator="OR"
                    orderKey="_term"
                    size={10}
                  />
                  <Searchkit.RefinementListFilter
                    id="member_of"
                    field="users.member_of.keyword"
                    title="Team Members"
                    operator="OR"
                    orderKey="_term"
                    size={10}
                  />
                </CollapsiblePanel>
                <hr />
                <CollapsiblePanel title="Science Area">
                  <Searchkit.RefinementListFilter
                    id="science_theme"
                    title="Area Name"
                    field="science_themes.keyword"
                    operator="OR"
                    orderKey="_term"
                    size={10}
                  />
                </CollapsiblePanel>
                <hr />

                <CollapsiblePanel title="Institution">
                  <Searchkit.RefinementListFilter
                    id="institution"
                    title="Institution Name"
                    field="institutions.keyword"
                    operator="AND"
                    orderKey="_term"
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
                    orderKey="_term"
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
                    orderKey="_term"
                    size={10}
                  />
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
                  itemComponent={<ProjectListItem {...this.props} />}
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