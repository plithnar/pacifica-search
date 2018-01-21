(function ($, $$) {
    "use strict";

    var Filter = PacificaSearch.Filter;
    var DomMgr = PacificaSearch.DomManager;
    var attr = PacificaSearch.Utilities.assertAttributeExists;
    var currTransactionPageNumber = 1;
    $(function () {
        $$('#search_filter')
            .on('change', 'input', function () {
                _updateOptions();
            })
            .on('click', '.prev_page', function () {
                _handlePageChangeClick(this, -1);
            })
            .on('click', '.next_page', function () {
                _handlePageChangeClick(this, 1);
            });

        function _updateOptions() {
            var filter = _getFilter();

            $$('#files').find('p').detach();

            $.ajax({
                url: '/filter',
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(filter.toObj())
            }).then(function () {
                _enableAndDisableFilterOptions();
                _updateTransactionList();
            });
        }

        $('#files .paging_button').off('click').on('click', function(event){
            var el = $(event.target);
            var new_page_num = currTransactionPageNumber
            if(el.hasClass('prev_page')){
                new_page_num = new_page_num > 1 ? new_page_num - 1 : 1;
            }else if(el.hasClass('next_page')){
                new_page_num++;
            }
            debugger;
            _updateTransactionList(new_page_num);
        });

        function _handlePageChangeClick(element, howManyPages) {
            element = $(element);
            var type = _getTypeByElement(element);
            var pageNumberContainer = $$(element.closest('fieldset').find('.page_number'));
            var curPage = parseInt(pageNumberContainer.text());
            var newPage = curPage + howManyPages;

            console.log("Change " + type + " from " + curPage + " to " + (curPage + howManyPages));
            $.get(
                '/filters/' + type + '/pages/' + newPage,
                function (results) {
                    var optionContainer = element.closest('fieldset').find('.option_container');
                    optionContainer.html('');

                    if (results.instances) {
                        results.instances.forEach(function (instance) {
                            var inputId = type + '_' + instance.id;
                            var input = $('<input type="checkbox">').attr('id', inputId).attr('data-id', instance.id);
                            var label = $('<label>').attr('for', inputId).append(input).append(instance.name);

                            optionContainer.append(label);
                        });
                    }

                    pageNumberContainer.text(newPage);
                }
            );
        }

        /**
         * Retrieve valid filter IDs from the server and mark each filter option as enabled or disabled accordingly
         */
        function _enableAndDisableFilterOptions() {
            $.get('/valid_filter_ids', function (results) {
                ['instrument_type', 'instrument', 'institution', 'user', 'proposal'].forEach(function (type) {
                    var idsToEnable = results[type];

                    DomMgr.FacetedSearchFilter.getInputsByType(type).each(function () {
                        var id = attr(this, 'data-id');
                        var disable = idsToEnable && (idsToEnable.indexOf(parseInt(id)) === -1);

                        if (disable) {
                            $(this).closest('label').addClass('disabled');
                            $(this).attr('disabled', true);
                        } else {
                            $(this).closest('label').removeClass('disabled');
                            $(this).removeAttr('disabled');
                        }
                    });
                });
            });
        }

        /**
         * Retrieve the list of files fitting the current filter and update the list shown to the user accordingly
         */
        function _updateFileList() {
            $.get('/files', function (results) {
                var fileTemplate = $$('#file_template').children();
                results.forEach(function(result) {
                    var fileEntry = fileTemplate.clone();
                    $$(fileEntry.find('[data-is-file-name-container]')).html(result['name']);
                    $$('#files').append(fileEntry);
                });
            });
        }

        function _updateTransactionList(pageNumber) {
            // $.get('/transactions', function (results) {
                if(pageNumber == null){
                    pageNumber = currTransactionPageNumber;
                }
                $('.results_instructions').hide();
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
                    }
                });
            // });
        }

        var getNextTransactionPage = function(){
            var prevPageNum = currentTransactionPageNumber - 1;
            prevPageNum = prevPageNum < 1 ? 1 : prevPageNum;
            return prevPageNum;
        };

        var getPrevTransactionPage = function(){
            return currentTransactionPageNumber + 1;
        };



//         $("#tree").fancytree({
//   // Initial node data that sets 'lazy' flag on some leaf nodes
//   source: [
//     {title: "Child 1", key: "1", lazy: true},
//     {title: "Folder 2", key: "2", folder: true, lazy: true}
//   ],
//   // Called when a lazy node is expanded for the first time:
//   lazyLoad: function(event, data){
//       var node = data.node;
//       // Load child nodes via Ajax GET /getTreeData?mode=children&parent=1234
//       data.result = {
//         url: "/getTreeData",
//         data: {mode: "children", parent: node.key},
//         cache: false
//       };
//   },
//   [...]
// });


        /**
         * @returns {PacificaSearch.Filter}
         */
        function _getFilter() {
            var filter = new Filter();

            DomMgr.FacetedSearchFilter.getAllTypes().forEach(function (type) {
                var selectedFilterIds = DomMgr.FacetedSearchFilter.getInputsByType(type, true).map(function () {
                    return attr(this, 'data-id');
                }).get();

                filter.set(type, selectedFilterIds);
            });

            console.log("Current filter: " + JSON.stringify(filter));

            return filter;
        }

        /**
         * For any element inside a filter <fieldset> element, returns the type associated with that fieldset
         *
         * @param {jQuery|string} element
         * @returns string
         */
        function _getTypeByElement (element) {
            var fieldset = $$($(element).closest('fieldset'));
            return attr(fieldset, 'data-type');
        }
    });
})(jQuery, PacificaSearch.Utilities.assertElementExists);
