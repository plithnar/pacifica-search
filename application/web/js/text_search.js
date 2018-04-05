(function ($, $$, undefined) {
    "use strict";
    if (undefined !== PacificaSearch.TextSearch) {
        throw new Error("PacificaSearch.TextSearch is already defined, did you include this file twice?");
    }

    var FilterManager = PacificaSearch.FilterManager;
    var Utilities = PacificaSearch.Utilities;

    /**
     * @singleton PacificaSearch.TextSearch
     *
     * Container object for methods that deal with the text search
     */
    PacificaSearch.TextSearch = {
        performTextSearch : function () {
            var searchQuery = PacificaSearch.DomManager.getTextSearchInput().val();

            if (searchQuery.length > 0) {
                var promise = $.get(
                    '/text_search',
                    {
                        search_query : searchQuery
                    }
                )

                .done(function (result) {
                    FilterManager.injectFilterResultIntoSidebar(result);
                })

                .fail(function () {
                    alert("The text search encountered an unexpected error");
                });

                Utilities.showLoadingAnimationUntilResolved(promise);
            }
        }
    };
})(jQuery, PacificaSearch.Utilities.assertElementExists);