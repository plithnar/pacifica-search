import React, {Component} from 'react';
import ItemAbstract from './itemAbstract';

export default class TransactionListItem extends Component {
    constructor(props) {
        super(props);
        this.displayFileList = this.displayFileList.bind(this);
    }

    loadFiles() {
        const source = this.props.result._source;
        $('#'+source.obj_id+'.results_filetree').fancytree({
            checkbox: function(event, data) {
                // Hide checkboxes for folders
                // return data.node.isFolder() ? false : true;

                // Hide all checkboxes for the moment
                return false;
            },
            source: {
                url: '/file_tree/transactions/' + source.obj_id.split('_')[1] + '/files',
                cache: false
            },
        });
    }

    buildSourceObj() {
        const source = this.props.result._source;
        /**
         * source object should be
         * [
         *  {
         *    "title": "proposal #"
         *    "key": "id"
         *    "folder": true
         *    children: [
         *      {
         *          title: "instrument info"
         *          key: "instrument id"
         *          folder: true
         *          children: [
         *              {
         *                  Title: "files uploaded blah blah (transaction number)"
         *                  key: "transaction id"
         *                  folder: true
         *                  lazy: true
         *                  }
         *                  ]
         *                  }
         *                  ]
         */
        const fileTreeObj = {
            title: "Files uploaded (Transaction " + source.obj_id.split('_')[1]+")",
            key: source.obj_id,
            folder: true,
            lazy: true
        };
        return fileTreeObj;
    }
    
    displayFileList() {
        this.openFilePanel();
        this.loadFiles();
    }

    openFilePanel() {
        const source = this.props.result._source;
        $('#'+source.obj_id+'.filesPanel').show();
    }


    renderAbstract(abstractText) {
        return (
            <ItemAbstract abstractText={abstractText}/>
        );
    }

    render() {
        const source = this.props.result._source;
        const proposals = source.proposals[0];
        const instruments = source.instruments[0];
        const themes = source.science_themes[0];
        const users = source.users[0];
        const access_url = source.access_url;
        return(
            <div className="transactionResultHit">
                {access_url !== undefined ? (
                    <div>
                        <b>Dataset:</b>
                        <a href={access_url} target="_blank">{source.obj_id.split('_')[1]}</a>
                    </div>
                ) : (
                    <div>
                        <b>Dataset:</b> {source.obj_id.split('_')[1]}
                    </div>
                    )}
                <b>Proposal:</b> {proposals.title} (#{proposals.obj_id.split('_')[1]}) <br />
                {this.renderAbstract(proposals.abstract)}
                <p>
                    <b>Instrument:</b> {instruments.display_name} (#{instruments.obj_id.split('_')[1]}) <br />
                    <b>Insturment Long Name:</b> {instruments.long_name}
                </p>
                <div style={{display:'inline'}}>
                    <button className="btn btn-default" onClick={this.displayFileList}>View Files</button>
                    <a className="btn btn-default" style={{marginLeft:'100px'}} href={access_url} target="_blank">Download Files</a>
                </div>
                <div className="transactionFileResults">
                    <div id={source.obj_id} className="filesPanel">
                        <div id={source.obj_id} className="results_filetree"></div>
                    </div>
                </div>
            </div>
        );
    }
}