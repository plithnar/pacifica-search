import React from 'react';
import ReactDOM from 'react-dom';
import TransactionSearch from './transaction_search';
import ProjectSearch from './project_search';

const SIZE = 10000;

export default class SearchApplication extends React.Component {


    constructor(props) {
      super(props);

      this.state = {
        projIds: [],
        showTransactions: false,
        showModal: false
      }
    }
  
    render() {
        return(
            <div>
              <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" />
              <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" />
              <ProjectSearch
                {...this.props} 
              />
            </div>
        );
    }
}

window.startSearchApp = function(esHost) {
    ReactDOM.render(<SearchApplication esHost={esHost} {...this.props} />, document.getElementById('searchkit_section'));
};