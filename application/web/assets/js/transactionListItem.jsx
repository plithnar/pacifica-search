import React, {Component} from 'react';

export default class TransactionListItem extends Component {
    constructor(props) {
        super(props);
        this.displayFileList = this.displayFileList.bind(this);
    }

    loadFiles() {
        const source = this.props.result._source;
        // debugger;
        // $.ajax({
        //     url: '/file_tree/transactions/' + this.props.result._source.obj_id + '/files'
        // }).success((result) => {
        //     console.log('ajax result', result);
        //     debugger;
        // });

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
            // source: this.buildSourceObj(),
            // lazyLoad: function(event, data){
            //     var transactionId = data.node.key;
            //     data.result = {
            //         url: '/file_tree/transactions/' + transactionId + '/files',
            //         data: {mode: 'children', parent: transactionId},
            //         cache: false
            //     };
            },
            // createNode: function(event, data){
            //     if($('#results_pager').is(':hidden')){
            //         $('#results_pager').show();
            //     }
            //     $('#files .page_number').html(1);
            //     $('.results_instructions').hide();
            //     $('#results_filetree').show()
            // }
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

    render() {
        const source = this.props.result._source;
        const proposals = source.proposals[0];
        const instruments = source.instruments[0];
        const themes = source.science_themes[0];
        const users = source.users[0];
        return(
            <div className="transactionResultHit">
                <div>
                    Dataset: {source.obj_id.split('_')[1]}
                </div>
                <p>
                    Proposal: {proposals.title} (#{proposals.obj_id.split('_')[1]}) <br />
                    Abstract: {proposals.abstract}
                </p>
                <p>
                    Instrument: {instruments.display_name} (#{instruments.obj_id.split('_')[1]}) <br />
                    Insturment Long Name: {instruments.long_name}
                </p>
                <button onClick={this.displayFileList}>View Files</button>
                <div className="transactionFileResults">
                    <div id={source.obj_id} className="filesPanel">
                        <div id={source.obj_id} className="results_filetree"></div>
                    </div>
                </div>
            </div>
        );
    }
}