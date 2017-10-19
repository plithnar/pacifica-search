(function ($, $$) {
    "use strict";

    var Filter = PacificaSearch.Filter;

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
                        var inputs = $$('fieldset[data-type="' + type + '"] input');

                        inputs.attr('disabled', true);

                        resultsForType.forEach(function (result) {
                            $$(inputs.filter('[data-id="' + result.id + '"]')).removeAttr('disabled');
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

            $$('fieldset[data-type]').each(function() {
                var selectedFilterIds = $(this).find('input:checked').map(function () {
                    return $(this).attr('data-id');
                }).get();

                filter.set($(this).attr('data-type'), selectedFilterIds);
            });

            console.log("Current filter: " + JSON.stringify(filter));

            return filter;
        }
    });
})(jQuery, PacificaSearch.Utilities.assertElementExists);