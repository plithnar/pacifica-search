import React, {Component} from 'react';
import ItemAbstract from './itemAbstract';
import TransactionSearch from './transaction_search';
import ProjectMetadata from './project_metadata';
import {Modal} from 'antd';
import 'antd/dist/antd.css';
import $ from 'jquery';

export default class ProjectListItem extends Component {
    constructor(props) {
        super(props);

        const source = props.result._source;
        this.state = {
            showModal: false,
            showMetadataModal: false,
            showUnreleased: false,
            obj_id: source.obj_id,
            projectId: source.obj_id.split('_')[1],
            releasedTransactions: this.getReleasedTransactions(source.obj_id)
        };

        this.toggleModal = this.toggleModal.bind(this);
        this.toggleMetadataModal = this.toggleMetadataModal.bind(this);
    }

    toggleUnreleasedModal() {
        this.setState({showUnreleased: true, showModal: !this.state.showModal})
    }

    toggleModal() {
        this.setState({showModal: !this.state.showModal, showUnreleased: false});
    }

    toggleMetadataModal() {
        this.setState({showMetadataModal: !this.state.showMetadataModal});
    }

    getReleasedTransactions(proj_id) {
        let released = 0;
        $.ajax({
            url: `${this.props.esHost}/_search`,
            data: JSON.stringify(this.buildQueryStructure(proj_id)),
            type: "POST",
            async: false,
            contentType: "application/json",
            dataType: "json"
        }).done((resp) => {
            released = resp.hits.total;
        });
        return released;
    }

    buildQueryStructure(proj_id) {
        return {
            "query": {
                "bool": {
                    "must": [
                        {
                            "term": {
                                "type": "transactions"
                            }
                        },
                        {
                            "term": {
                                "projects.obj_id": proj_id
                            }
                        },
                        {
                            "term": {
                                "release": true
                            }
                        }
                    ]
                }
            },
            "size": 1
        }
    }

    renderAbstract(abstractText) {
        return (
            <ItemAbstract abstractText={abstractText}/>
        );
    }

    render() {
        const source = this.props.result._source;
        return(
            <div className="projectResultHit">
                <a href={`/?project[0]=${source.obj_id}`} >
                    <b>Project:</b> {source.title} (#{source.obj_id.split('_')[1]})
                </a>
                <br />
                {this.renderAbstract(source.abstract)} <br />
                <div style={{'display': 'inline-flex'}}>
                    {this.props.showUnreleased && (
                        <div onClick={this.toggleUnreleasedModal} style={{'color':'#08c', 'cursor': 'pointer', 'marginRight': '50px'}}>
                            <b>Number of Datasets:</b> {source.transaction_ids.length}
                        </div>
                    )}
                    <div onClick={this.toggleModal} style={{'color':'#08c', 'cursor': 'pointer'}}>
                        <b>Number of Released Datasets:</b> {this.state.releasedTransactions}
                    </div>
                <div onClick={this.toggleMetadataModal} style={{'color':'#08c', 'cursor': 'pointer', 'marginLeft': '50px'}}>
                    <b>Explore Project Metadata</b>
                </div>
                </div>
                <Modal
                    visible={this.state.showModal}
                    title={<div>Datasets for Project {this.state.projectId}</div>}
                    footer={null}
                    width="80%"
                    onCancel={this.toggleModal}
                    style={{height:'90vh', overflow:'scroll', top:'5vh'}}
                >
                    <TransactionSearch {...this.props} obj_id={this.state.obj_id} showUnreleased={this.state.showUnreleased} />
                </Modal>
                <Modal
                    visible={this.state.showMetadataModal}
                    title={<div>Metadata for Project {this.state.projectId}</div>}
                    footer={null}
                    width="80%"
                    onCancel={this.toggleMetadataModal}
                    style={{height:'90vh', overflow:'scroll', top:'5vh'}}
                >
                    <ProjectMetadata {...this.props} metadata={source} released={this.state.releasedTransactions} />
                </Modal>
            </div>
        );
    }
}