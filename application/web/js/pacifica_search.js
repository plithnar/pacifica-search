(function ($, $$) {
    "use strict";

    var Filter = PacificaSearch.Filter;
    var DomMgr = PacificaSearch.DomManager;
    var attr = PacificaSearch.Utilities.assertAttributeExists;
    var currTransactionPageNumber = 1;
    $(function () {
        $$('#search_filter')
            .on('change', 'input', function () {
                var selectedOption = $(this).closest('label');
                var selectedOptionType = _getTypeByElement(selectedOption);
                selectedOption.detach();

                var filterContainer = _getCurrentFilterContainerForType(selectedOptionType)
                if (this.checked) {
                    filterContainer.append(selectedOption);
                }

                if(filterContainer.find('input').length > 0) {
                    filterContainer.show();
                } else {
                    filterContainer.hide();
                }
                if($('#search_filter').find('input[type="checkbox"]:checked').length > 0){
                    _persistUpdatedFilter();
                }else{
                    $('#results_filetree').hide()
                    $('.results_instructions').show();
                }
            })
            .on('click', '.prev_page', function () {
                _handlePageChangeClick(this, -1);
            })
            .on('click', '.next_page', function () {
                _handlePageChangeClick(this, 1);
            });

        /**
         * Persists the currently selected filter values to the server, and updates the available filter options
         * accordingly.
         *
         * _.debounce() turns this function into a debounced function - the user can make several changes to the filter
         * in quick succession, and the AJAX call won't actually go out until they've stopped for a brief time.
         *
         * TODO: We might need to change this to also fire if the user attempts to select an option from a different
         * filter type. The problem is, a user could select an instrument, then quickly select an Institution that
         * doesn't fit the instrument. A solution could be to disable every other filter type when an option is selected,
         * then re-enable them in the .then() call here, so you could quickly select several of the same type but would
         * have to wait for the load cycle to complete before selecting filters of another type.
         */
        var _persistUpdatedFilter = _.debounce(function() {
            console.log('Deeeeebounce!');
            $('#results_filetree').show()
            $.ajax({
                url: '/filter',
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(_getFilter().toObj())
            }).then(function () {
                $.get('/filter/pages', function(result) {
                    for(var type in result) {
                        _getOptionContainerForType(type).html('');
                        result[type].instances.forEach(function (instance) {
                            _addInstanceToType(instance, type);
                        });
                    }
                    _updateTransactionList()
                });
            });
        }, 2000);

        function _handlePageChangeClick(element, howManyPages) {
            element = $(element);
            var type = _getTypeByElement(element);
            var pageNumberContainer = $$(element.closest('fieldset').find('.page_number'));
            var curPage = parseInt(pageNumberContainer.text());
            var newPage = curPage + howManyPages;

            _loadFilterPage(type, newPage);
        }

        function _loadFilterPage(type, pageNumber) {
            $.get(
                '/filters/' + type + '/pages/' + pageNumber,
                function (results) {
                    _getOptionContainerForType(type).html('');

                    if (results.instances) {
                        results.instances.forEach(function (instance) {
                            _addInstanceToType(instance, type);
                        });
                    }

                    $$(_getContainerForType(type).find('.page_number')).text(pageNumber);
                }
            );
        }

        // TODO: Move all of these methods into a DomManager class
        function _getOptionContainerForType(type) {
            return $$(_getContainerForType(type).find('.option_container'));
        }

        function _getCurrentFilterContainerForType(type) {
            return $$(_getContainerForType(type).find('.current_filter_options'));
        }

        function _getContainerForType(type) {
            return $$('fieldset[data-type="' + type + '"]');
        }

        function _addInstanceToType(instance, type) {
            var inputId = type + '_' + instance.id;
            var input = $('<input type="checkbox">').attr('id', inputId).attr('data-id', instance.id);
            var label = $('<label>').attr('for', inputId).append(input).append(instance.name);

            _getOptionContainerForType(type).append(label);
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
                        }
                    });
                }else{
                    $('#results_filetree').fancytree('option', 'source', {
                        url: '/file_tree/pages/' + pageNumber,
                        cache: false
                    }
                );
                }
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


        $('#files .paging_button').off('click').on('click', function(event){
            var el = $(event.target);
            var new_page_num = currTransactionPageNumber
            if(el.hasClass('prev_page')){
                new_page_num = new_page_num > 1 ? new_page_num - 1 : 1;
            }else if(el.hasClass('next_page')){
                new_page_num++;
            }
            _updateTransactionList(new_page_num);
        });

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
