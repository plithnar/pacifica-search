(function ($, $$) {
    "use strict";

    var Filter = PacificaSearch.Filter;
    var DomMgr = PacificaSearch.DomManager;
    var attr = PacificaSearch.Utilities.assertAttributeExists;

    $(function () {
        $$('#search_filter')
            .on('change', 'input', function () {
                var selectedOption = $(this).closest('label');
                var selectedOptionType = _getTypeByElement(selectedOption);
                selectedOption.detach();

                if (this.checked) {
                    _getCurrentFilterContainerForType(selectedOptionType).append(selectedOption);
                }

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
                     });
                });
            })
            .on('click', '.prev_page', function () {
                _handlePageChangeClick(this, -1);
            })
            .on('click', '.next_page', function () {
                _handlePageChangeClick(this, 1);
            });

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