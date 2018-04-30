(function ($, $$, undefined) {
    "use strict";
    if (undefined !== PacificaSearch.FilterManager) {
        throw new Error("PacificaSearch.FilterManager is already defined, did you include this file twice?");
    }

    var DomManager = PacificaSearch.DomManager;
    var FileTreeManager = PacificaSearch.FileTreeManager;
    var Filter = PacificaSearch.Filter;
    var Utilities = PacificaSearch.Utilities;

    /**
     * @singleton PacificaSearch.FilterManager
     *
     * Container object for methods related to Pacifica Search's faceted search filter
     */
    PacificaSearch.FilterManager = {

        /**
         * Gets an instance of Filter representing the currently selected Filter options
         *
         * @returns {PacificaSearch.Filter}
         */
        getFilter : function () {
            var filter = new Filter();

            DomManager.FacetedSearchFilter.getAllTypes().forEach(function (type) {
                var selectedFilterIds = DomManager.FacetedSearchFilter.getInputsByType(type, true).map(function () {
                    return Utilities.assertAttributeExists(this, 'data-id');
                }).get();
                filter.set(type, selectedFilterIds);
            });

            return filter;
        },

        /**
         * Loads a single page of results into the sidebar for a single type
         *
         * @param {string} type
         * @param {Number} pageNumber
         */
        loadFilterPage : function (type, pageNumber) {
            var self = this;
            var filterObj = this.getFilter().toObj();

            PacificaSearch.Utilities.postJson(
                '/filters/' +type + '/pages/' + pageNumber,
                filterObj,
                function (results) {
                    DomManager.FacetedSearchFilter.getOptionContainerForType(type).html('');
                    if (results.instances) {
                        results.instances.forEach(function (instance) {
                            self.addInstanceToType(instance, type);
                        });
                    }

                    $$(DomManager.FacetedSearchFilter.getContainerForType(type).find('.page_number')).text(pageNumber);
                }
            );
        },

        /**
         * Adds a single option to the filter sidebar
         * @param {object} instance The object is in the same form as the results returned by the
         * filters/{type}/pages/{page} REST resource
         * @param {string} type
         */
        addInstanceToType : function (instance, type) {
            var inputId = type + '_' + instance.id;
            var input = $('<input type="checkbox">').attr('id', inputId).attr('data-id', instance.id);
            var label = $('<label>').attr('for', inputId).append(input).append(instance.name);

            DomManager.FacetedSearchFilter.getOptionContainerForType(type).append(label);
        },

        /**
         * This method is meant to be called whenever the "change page" elements of the filter types are clicked
         * @param {Element} element The DOM element that was clicked
         * @param {Number} howManyPages How many pages to add or (for a negative number) subtract from the current page
         */
        handlePageChangeClick : function (element, howManyPages) {
            element = $(element);
            var type = DomManager.FacetedSearchFilter.getTypeByElement(element);
            var pageNumberContainer = $$(element.closest('fieldset').find('.page_number'));
            var curPage = parseInt(pageNumberContainer.text());
            var newPage = curPage + howManyPages;

            this.loadFilterPage(type, newPage);
        },

        /**
         * Makes the border separating the upper and lower sections of a filter (the selected and unselected options,
         * respectively) visible or hidden depending on whether both sections contain elements.
         * @param {string} type
         */
        updateBorderBetweenContainers : function (type) {
            var filterContainer = DomManager.FacetedSearchFilter.getCurrentFilterContainerForType(type);
            var optionContainer = DomManager.FacetedSearchFilter.getOptionContainerForType(type);

            // Hide the border separating the selected from the unselected items if either is empty
            if(filterContainer.find('input').length === 0 || optionContainer.find('input').length === 0) {
                filterContainer.css('border-bottom', 'none');
            } else {
                filterContainer.css('border-bottom', '2px solid #888');
            }
        },

        /**
         * Updates the options available in the faceted search filter based on what other values are already selected
         *
         * _.debounce() turns this function into a debounced function - the user can make several changes to the filter
         * in quick succession, and the AJAX call won't actually go out until they've stopped for a brief time.
         *
         * @param {function} callback Invoked after the AJAX call returns. This is implemented as a callback rather than
         *   the standard of returning a Promise because debounced functions can't return anything.
         */
        updateAvailableFilterOptions : _.debounce(function(callback) {
            var filterObj = this.getFilter().toObj();

            PacificaSearch.Utilities.showLoadingAnimationUntilResolved(
                PacificaSearch.Utilities.postJson(
                    '/filters/pages',
                    filterObj,
                    function (result) {
                        PacificaSearch.FilterManager.injectFilterResultIntoSidebar(result);
                        callback();
                    }
                )
            )
        }, 2000),

        injectFilterResultIntoSidebar : function (result) {
            var self = this;
            Object.getOwnPropertyNames(result).forEach(function (type) {
                DomManager.FacetedSearchFilter.getOptionContainerForType(type).html('');
                result[type].instances.forEach(function (instance) {
                    self.addInstanceToType(instance, type);
                });
            });
            FileTreeManager.updateTransactionList();
            $('#results_filetree').show();
        }

    };
})(jQuery, PacificaSearch.Utilities.assertElementExists);
