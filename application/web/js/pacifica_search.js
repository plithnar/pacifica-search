(function ($, $$) {
    "use strict";

    var TransactionFilter = PacificaSearch.TransactionFilter;

    $(function () {
        $(".search_results_block select").select2({placeholder: "Select an item from the list", sorter: function (data) {
            return data.sort(function (a, b) {
                return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
            });
        }
        }).on("select2:select", function (e) {
            var myId = e.target.id;
            $(myId + " .select2-selection__rendered li.select2-selection__choice").sort(function (a, b) {
                return $(a).text() < $(b).text() ? -1 : $(a).text() > $(b).text() ? 1 : 0;
            }).prependTo(myId + " .select2-selection__rendered");
        });

        // Bind the "Pacifica Search Button" to trigger a search when it's clicked
        $$('#pacifica_search_button').on('click', function () {
            _updateOptions();
        });

        // Populate all the options by calling _updateOptions once on page load
        _updateOptions();

        function _updateOptions() {
            var filter = _getTransactionFilter();
            filter.getTransactionIds().then(function (transactionIds) {
                // Call the FilterQuery method associated with each data type. These methods generate Query instances
                // that will return all the records for an input, filtered according to the user's current selection
                Object.keys(PacificaSearch.FilterQuery).forEach(function (type) {
                    PacificaSearch.FilterQuery[type](transactionIds)

                        // Once we've got the filter Query, we pass it into the FilterQueryToContent method for the data type,
                        // which is responsible for retrieving the Query's results and converting them to the content that
                        // will actually be inserted into the page
                        .then(function (query) {
                            return PacificaSearch.FilterQueryToContent[type](query);
                        })

                        // Once we have the content for each option, we find the container object that is associated with the
                        // data type, and we inject the generated content into it.
                        .then(function (options) {
                            _renderOptions(type, options);
                        });
                });
            });
        }

        function _renderOptions(type, options) {
            var container = $$('[data-pacifica-search-container="' + type + '"]');
            var selected = container.val();
            container.html('');
            container.append(options);

            // We have to re-select the values that were selected before the control was rebuilt, because
            // otherwise the selection gets lost
            container.val(selected);
            _updateRecordCount(type, options.length);
        }

        /**
         * Set the record count for each data type to display the number of items of that type
         *
         * @param {string} type
         * @param {number} count
         */
        function _updateRecordCount(type, count) {
            var label = $$('label[for="' + type + '"]');
            var target = $$(label.find('span[data-record-count]'));
            target.html(count);
        }

        /**
         * @returns PacificaSearch.TransactionFilter
         */
        function _getTransactionFilter() {
            var filter = new TransactionFilter();

            $$('[data-is-filter]').each(function () {
                var filterInput = $(this);
                var type = filterInput.attr('data-pacifica-search-container');

                // We are playing a bit fast and loose with DRY principles because it's just not pragmatic to define our
                // types centrally. So here we are at least enforcing that every Type defined in the DOM is also defined
                // in the TYPE constants and in the TransactionFilter's properties, which should keep us from having
                // inconsistencies.
                if (Object.values(PacificaSearch.TYPE).indexOf(type) == -1) {
                    throw new Error('Unexpected type "' + type + '" found - All types defined in the DOM should also be added to the PacificaSearch.TYPE constant collection');
                }
                if (undefined === filter[type]) {
                    throw new Error('Unexpected type "' + type + '" found - All types defined in the DOM should also be added to the PacificaSearch.TransactionFilter prototype');
                }

                var selected = filterInput.val();
                filter[type] = selected || [];
            });

            console.log("Current filter: " + JSON.stringify(filter));

            return filter;
        }
    });
})(jQuery, PacificaSearch.Utilities.assertElementExists);