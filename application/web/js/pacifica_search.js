(function ($, $$) {
    "use strict";

    var Filter = PacificaSearch.Filter;
    var DomMgr = PacificaSearch.DomManager;
    var attr = PacificaSearch.Utilities.assertAttributeExists;

    $(function () {
        $$('#pacifica_search_button').on('click', function () {
            _updateOptions();
        });

        function _updateOptions() {
            var filter = _getFilter();

            $.ajax({
                url: '/filter',
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(filter.toObj())
            }).then(function () {
                $.get('/results', function (results) {
                    Object.keys(results).forEach(function (type) {
                        var resultsForType = results[type];

                        var idsToEnable = resultsForType.map(function (result) {
                            return result.id;
                        });

                        DomMgr.FacetedSearchFilter.getInputsByType(type).each(function () {
                            var id = attr(this, 'data-id');
                            var disable = (idsToEnable.indexOf(id) === -1);
                            $(this).attr('disabled', disable);
                        });
                    });
                });
            });
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
    });
})(jQuery, PacificaSearch.Utilities.assertElementExists);