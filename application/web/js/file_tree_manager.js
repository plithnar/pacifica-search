(function ($, $$, undefined) {
    "use strict";
    if (undefined !== PacificaSearch.FileTreeManager) {
        throw new Error("PacificaSearch.FileTreeManager is already defined, did you include this file twice?");
    }

    /**
     * Tracks the current page number of the transactions (file tree) element
     * @type {number}
     */
    var currTransactionPageNumber = 1;

    /**
     * @singleton PacificaSearch.FileTreeManager
     *
     * Container object for methods related to Pacifica Search's file tree element, which shows the transactions and
     * their associated files when a search has returned results.
     */
    PacificaSearch.FileTreeManager = {

        updateTransactionList : function (pageNumber) {
            if(pageNumber === undefined){
                pageNumber = currTransactionPageNumber;
            }
            if(!$('#results_filetree').find('.ui-fancytree').length){
                $('#results_filetree').fancytree({
                    source: {
                        url: '/file_tree/pages/' + pageNumber,
                        cache: false
                    },
                    lazyLoad: function(event, data){
                        var node = data.node;
                        data.result = {
                            url: '/file_tree/transactions/' + node.key + '/files',
                            data: {mode: 'children', parent: node.key},
                            cache: false
                        }
                    },
                    createNode: function(event, data){
                        if($('#results_pager').is(':hidden')){
                            $('#results_pager').show();
                        }
                        $('#files .page_number').html(pageNumber);
                        $('.results_instructions').hide();
                        $('#results_filetree').show()
                    }
                });
            }else{
                $('#results_filetree').fancytree('option', 'source', {
                        url: '/file_tree/pages/' + pageNumber,
                        cache: false
                    }
                );
            }
        }

    };

    $('#files .paging_button').off('click').on('click', function(event){
        var el = $(event.target);
        var newPageNumber = currTransactionPageNumber;
        if(el.hasClass('prev_page')){
            newPageNumber = newPageNumber > 1 ? newPageNumber - 1 : 1;
        }else if(el.hasClass('next_page')){
            newPageNumber++;
        }
        PacificaSearch.FileTreeManager.updateTransactionList(newPageNumber);
    });
})(jQuery, PacificaSearch.Utilities.assertElementExists);
