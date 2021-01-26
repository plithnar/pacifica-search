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
      timeout: 10000,
      searchUrlPath : "_search?rest_total_hits_as_int=true"
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
        {"wildcard": {"obj_id.keyword": `projects_${e}*`}},
        {"wildcard": {"title.keyword.normalize": `*${e}*`}}
      ])
  }

  buildPIQuery(e) {
    const BoolShould = Searchkit.BoolShould;

    return BoolShould([
      {"wildcard": {"users.principal_investigator.keyword": `*${e}*`}}
    ])
  }

  buildCoPIQuery(e) {
    const BoolShould = Searchkit.BoolShould;

    return BoolShould([
      {"wildcard": {"users.co_principal_investigator.keyword": `*${e}*`}}
    ])
  }

  buildTeamMemberQuery(e) {
    const BoolShould = Searchkit.BoolShould;

    return BoolShould([
      {"wildcard": {"users.member_of.keyword": `*${e}*`}}
    ])
  }

  buildInstitutionQuery(e) {
    const BoolShould = Searchkit.BoolShould;

    return BoolShould([
      {"wildcard": {"institutions.keyword": `*${e}*`}}
    ])
  }
  buildInstrumentQuery(e) {
    const BoolShould = Searchkit.BoolShould;

    return BoolShould([
      {"wildcard": {"instruments.keyword": `*${e}*`}}
    ])
  }
  buildInstrumentGroupQuery(e) {
    const BoolShould = Searchkit.BoolShould;

    return BoolShould([
      {"wildcard": {"groups.keyword": `*${e}*`}}
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

    getToday() {
        return new Date();
    }

    getOneYearAgoFromToday() {
        return new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    }

  render() {
    var informationText = `The following special characters are supported:
        + signifies AND operation
      | signifies OR operation
      - negates a single token
      " wraps a number of tokens to signify a phrase
      * at the end of a term signifies a prefix query
      ( and ) signify precedence
      ~N after a word signifies edit distance (fuzziness)
      ~N after a phrase signifies slop amount
      In order to search for any of these special characters, they will need to be escaped with \\\\.`;
    return (
      <div>
        <Searchkit.SearchkitProvider searchkit={this.searchkit}>
          <Searchkit.Layout size="1">
            <Searchkit.TopBar>
              <Searchkit.SearchBox
                id="project_query"
                translations={{"searchbox.placeholder":"Search Projects"}}
                queryOptions={{"minimum_should_match":"95%", "analyze_wildcard":"true", "fuzziness":"AUTO", 'fuzzy_prefix_length': 2}}
                queryBuilder={Searchkit.QueryString}
                auotfocus={true}
                searchOnChange={true}
                searchThrottleTime={750}
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
              <Searchkit.SideBar style={{flex: '0 0 270px !important'}}>
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
                    queryOptions={{"analyzer": "lowercase"}}
                    queryFields={["projects.obj_id.keyword"]}
                    prefixQueryFields={["projects.title.keyword"]}
                  />
                  <CollapsiblePanel title="Matching Projects">
                    <Searchkit.RefinementListFilter
                      id="project_id"
                      title="Project ID List"
                      field="obj_id.keyword"
                      operator="AND"
                      orderKey="_term"
                      size={10}
                    />
                  </CollapsiblePanel>

                  <Searchkit.NumericRefinementListFilter
                    id="transaction_count"
                    title="# Archived Datasets"
                    field="transaction_count"
                    options={[
                      {title:"All"},
                      {title:"No Datasets", from:0, to:1},
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
                    <DateRangeFilter
                        id="closed_date"
                        field="closed_date"
                        queryDateFormat="YYYY-MM-DD"
                        title="Closed Date"
                        startDate={this.formatDateForDatePicker(this.getOneYearAgoFromToday())}
                        endDate={this.formatDateForDatePicker(this.getToday())}
                    />
                </CollapsiblePanel>
                <hr />
                <CollapsiblePanel title="EMSL Users">
                  <Searchkit.InputFilter
                    id="pi_search"
                    title="Principal Investigator Search"
                    placeholder="Principal Investigator Name"
                    queryBuilder={this.buildPIQuery.bind(this)}
                    queryFields={["users.principal_investigator.keyword"]}
                    searchOnChange={true}
                    searchThrottleTime={750}
                  />
                  <Searchkit.RefinementListFilter
                    id="principal_investigator"
                    field="users.principal_investigator.keyword"
                    title="Principal Investigators"
                    operator="OR"
                    orderKey="_term"
                    size={10}
                  />
                  <Searchkit.InputFilter
                    id="copi_search"
                    title="Co-Principal Investigator Search"
                    placeholder="Co-Principal Investigator Name"
                    queryBuilder={this.buildCoPIQuery.bind(this)}
                    queryFields={["users.co_principal_investigator.keywor"]}
                    searchOnChange={true}
                    searchThrottleTime={750}
                  />
                  <Searchkit.RefinementListFilter
                    id="co_principal_investigator"
                    field="users.co_principal_investigator.keyword"
                    title="Co-Principal Investigators"
                    operator="OR"
                    orderKey="_term"
                    size={10}
                  />
                  <Searchkit.InputFilter
                    id="member_search"
                    title="Team Member Search"
                    placeholder="Team Member Name"
                    queryBuilder={this.buildTeamMemberQuery.bind(this)}
                    queryFields={["users.member_of.keyword"]}
                    searchOnChange={true}
                    searchThrottleTime={750}
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
                  <Searchkit.InputFilter
                    id="institution_search"
                    title="Institution Search"
                    placeholder="Institution Name"
                    queryBuilder={this.buildInstitutionQuery.bind(this)}
                    queryFields={["institutions.keyword"]}
                    searchOnChange={true}
                    searchThrottleTime={750}
                  />
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
                  <Searchkit.InputFilter
                    id="instrument_search"
                    title="Instrument Search"
                    placeholder="Instrument Name"
                    queryBuilder={this.buildInstrumentQuery.bind(this)}
                    queryFields={["instruments.keyword"]}
                    searchOnChange={true}
                    searchThrottleTime={750}
                  />
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
                  <Searchkit.InputFilter
                    id="instrument_group_search"
                    title="Instrument Group Search"
                    placeholder="Instrument Group Name"
                    queryBuilder={this.buildInstrumentGroupQuery.bind(this)}
                    queryFields={["groups.keyword"]}
                    searchOnChange={true}
                    searchThrottleTime={750}
                  />
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
                    <Searchkit.SortingSelector options={[
                        {label: "Most Recently Started", field: "actual_start_date", order:"desc", defaultOption:true},
                        {label: "Least Recently Started", field: "actual_start_date", order:"asc"},
                        {label: "Most Recently Closed", field: "closed_date", order:"desc"},
                        {label: "Least Recently Closed", field: "closed_date", order:"asc"},
                        {label: "Most Open Access Datasets", field: "transaction_count", order:"desc"},
                        {label: "Least Open Access Datasets", field: "transaction_count", order:"asc"},
                        {label: "Most Archived Datasets", field: "transaction_count", order:"desc"},
                        {label: "Least Archived Datasets", field: "transaction_count", order:"asc"}
                    ]} />
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