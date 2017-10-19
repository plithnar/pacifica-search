(function ($, $$, undefined) {
    "use strict";
    if (undefined !== PacificaSearch.DomManager) {
        throw new Error("PacificaSearch.Utilities is already defined, did you include this file twice?");
    }

    /**
     * @singleton PacificaSearch.DomManager
     *
     * Container object for methods that retrieve elements from the page. In general, retrieval of DOM elements should
     * be done through these methods, to remove other classes' dependency on the DOM
     */
    PacificaSearch.DomManager = {
        /**
         * Retrieval methods associated with the faceted search filter
         */
        FacetedSearchFilter : {

            /**
             * Retrieves the inputs used to toggle filter options on and off for a given filter type
             * @param {string} type Must be one of the PacificaSearch.TYPE.* constants
             * @returns {jQuery}
             */
            getInputsByType : function(type) {
                return $$('fieldset[data-type="' + type + '"] input');
            },

            /**
             * Retrieves all of the inputs used to toggle filter options on and off
             * @returns {jQuery}
             */
            getAllInputs : function() {
                return $$('fieldset[data-type"] input');
            }
        }

    };
})(jQuery, PacificaSearch.Utilities.assertElementExists);
