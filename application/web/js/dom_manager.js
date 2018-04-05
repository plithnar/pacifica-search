(function ($, $$, undefined) {
    "use strict";
    if (undefined !== PacificaSearch.DomManager) {
        throw new Error("PacificaSearch.DomManager is already defined, did you include this file twice?");
    }

    /**
     * @singleton PacificaSearch.DomManager
     *
     * Container object for methods that retrieve elements from the page. In general, retrieval of DOM elements should
     * be done through these methods, to remove other classes' dependency on the DOM
     */
    PacificaSearch.DomManager = {
        /**
         * Gets the input that allows the user to enter a text search query
         * @returns {jQuery}
         */
        getTextSearchInput : function () {
            return $$('#text-search');
        },

        /**
         * Gets the element(s) responsible for showing that the page is in its "loading" state
         * @returns {jQuery}
         */
        getLoadingAnimation : function () {
            return $$('.loading_blocker');
        },

        /**
         * Retrieval methods associated with the faceted search filter
         */
        FacetedSearchFilter : {

            /**
             * Retrieves the inputs used to toggle filter options on and off for a given filter type
             * @param {string} type Must be one of the PacificaSearch.TYPE.* constants
             * @param {boolean=} selected Only return selected inputs
             * @returns {jQuery}
             */
            getInputsByType : function(type, selected) {
                var inputs = $$('fieldset[data-type="' + type + '"] input');
                if (selected) {
                    inputs = inputs.filter(':checked');
                }
                return inputs;
            },

            /**
             * Gets all of the types for which filter inputs are present on the page
             * @returns {string[]}
             */
            getAllTypes : function() {
                var types = [];
                $$('fieldset[data-type]').each(function () {
                    types.push($(this).attr('data-type'));
                });
                return types;
            },

            /**
             * Gets the DOM element containing the available filter options for a type
             * @param {string} type
             * @returns {jQuery}
             */
            getOptionContainerForType : function (type) {
                return $$(this.getContainerForType(type).find('.option_container'));
            },

            /**
             * Gets the DOM element containing the currently selected filter options for a type
             * @param {string} type
             * @returns {jQuery}
             */
            getCurrentFilterContainerForType : function (type) {
                return $$(this.getContainerForType(type).find('.current_filter_options'));
            },

            /**
             * Gets the DOM element that contains a filter for a type
             * @param {string} type
             * @returns {jQuery}
             */
            getContainerForType : function (type) {
                return $$('fieldset[data-type="' + type + '"]');
            },

            /**
             * For any element inside a filter <fieldset> element, returns the type associated with that fieldset
             *
             * @param {jQuery|string} element
             * @returns string
             */
            getTypeByElement : function (element) {
                var fieldset = $$($(element).closest('fieldset'));
                return PacificaSearch.Utilities.assertAttributeExists(fieldset, 'data-type');
            }
        }
    };
})(jQuery, PacificaSearch.Utilities.assertElementExists);
