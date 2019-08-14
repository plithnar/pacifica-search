import React, {Component} from 'react';
import ItemAbstract from './itemAbstract';
import TransactionSearch from './transaction_search';
import {Modal} from 'antd';
import 'antd/dist/antd.css';

export default class ProjectListItem extends Component {
    constructor(props) {
        super(props);

      const source = props.result._source;
      this.state = {
        showModal: false,
        obj_id: source.obj_id,
        projectId: source.obj_id.split('_')[1]
      }

      this.toggleModal = this.toggleModal.bind(this)
;    }

  toggleModal() {
    this.setState({showModal: !this.state.showModal});
  }

  renderAbstract(abstractText) {
    return (
      <ItemAbstract abstractText={abstractText}/>
    );
  }
    render() {
        const source = this.props.result._source;
        return(
            <div className="transactionResultHit">
              <b>Project:</b> {source.title} (#{source.obj_id.split('_')[1]}) <br />
              {this.renderAbstract(source.abstract)} <br />
              <div onClick={this.toggleModal} style={{'color':'#08c'}}>
                <b>Number of Datasets:</b> {source.transaction_ids.length}
              </div>
              <Modal
                visible={this.state.showModal}
                title={<div>Datasets for Project {this.state.projectId}</div>}
                footer={null}
                width="80%"
                onCancel={this.toggleModal}
                style={{height:'90vh', overflow:'scroll', top:'5vh'}}
              >
                <TransactionSearch {...this.props} obj_id={this.state.obj_id} />
              </Modal>
            </div>
        );
    }
}