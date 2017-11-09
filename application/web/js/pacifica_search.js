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