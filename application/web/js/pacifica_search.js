(function ($, $$) {
    "use strict";

    var Filter = PacificaSearch.Filter;
    var DomMgr = PacificaSearch.DomManager;
    var attr = PacificaSearch.Utilities.assertAttributeExists;

    $(function () {
        $$('#search_filter')
            .on('change', 'input', function () {
                _updateOptions();
            })
            .on('click', '.prev_page', function () {
                _handlePageChangeClick(this, -1);
            })
            .on('click', '.next_page', function () {
                _handlePageChangeClick(this, 1);
            });

        function _updateOptions() {
            var filter = _getFilter();

            $$('#files').find('p').detach();

            $.ajax({
                url: '/filter',
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(filter.toObj())
            }).then(function () {
                _enableAndDisableFilterOptions();
                _updateTransactionList();
            });
        }

        function _handlePageChangeClick(element, howManyPages) {
            element = $(element);
            var type = _getTypeByElement(element);
            var pageNumberContainer = $$(element.closest('fieldset').find('.page_number'));
            var curPage = parseInt(pageNumberContainer.text());
            var newPage = curPage + howManyPages;

            console.log("Change " + type + " from " + curPage + " to " + (curPage + howManyPages));
            $.get(
                '/filters/' + type + '/pages/' + newPage,
                function (results) {
                    var optionContainer = element.closest('fieldset').find('.option_container');
                    optionContainer.html('');

                    if (results.instances) {
                        results.instances.forEach(function (instance) {
                            var inputId = type + '_' + instance.id;
                            var input = $('<input type="checkbox">').attr('id', inputId).attr('data-id', instance.id);
                            var label = $('<label>').attr('for', inputId).append(input).append(instance.name);

                            optionContainer.append(label);
                        });
                    }

                    pageNumberContainer.text(newPage);
                }
            );
        }

        /**
         * Retrieve valid filter IDs from the server and mark each filter option as enabled or disabled accordingly
         */
        function _enableAndDisableFilterOptions() {
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

        function _updateTransactionList() {
            // $.get('/transactions', function (results) {
                $('.results_instructions').hide();
                $('#results_filetree').fancytree({
                    source:
                    [
                        {
                            title: "Proposal #31390",
                            key: "31390",
                            folder: true,
                            children: [
                                {
                                    title: "TOF-SIMS 2007 (Instrument ID: 34073)",
                                    key: "34073",
                                    folder: true,
                                    children: [
                                        {
                                            title: "Files Uploaded 2017-01-02 (Transaction 37778)",
                                            key: "37778", folder: true, lazy: true
                                        },
                                        {
                                            title: "Files Uploaded 2017-01-04 (Transaction 38110)",
                                            key: "38110", folder: true, lazy: true
                                        },
                                        {
                                            title: "Files Uploaded 2017-01-15 (Transaction 39228)",
                                            key: "39228", folder: true, lazy: true
                                        },
                                        {
                                            title: "Files Uploaded 2017-02-02 (Transaction 40998)",
                                            key: "40998", folder: true, lazy: true
                                        }
                                    ]
                                },
                                {
                                    title: "Special NMR (Instrument ID: 34075)",
                                    key: "34075",
                                    folder: true,
                                    children: [
                                        {
                                            title: "Files Uploaded 2017-01-01 (Transaction 38990)",
                                            key: "38990", folder: true, lazy: true
                                        },
                                        {
                                            title: "Files Uploaded 2017-01-03 (Transaction 38995)",
                                            key: "38995", folder: true, lazy: true
                                        },
                                        {
                                            title: "Files Uploaded 2017-01-14 (Transaction 39776)",
                                            key: "39776", folder: true, lazy: true
                                        },
                                        {
                                            title: "Files Uploaded 2017-02-12 (Transaction 41908)",
                                            key: "41908", folder: true, lazy: true
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            title: "Proposal #2308",
                            key: "2308",
                            folder: true,
                            children: [
                                {
                                    title: "TOF-SIMS 2007 (Instrument ID: 34073)",
                                    key: "34073",
                                    folder: true,
                                    children: [
                                        {
                                            title: "Files Uploaded 2017-01-02 (Transaction 37780)",
                                            key: "37780", folder: true, lazy: true
                                        },
                                        {
                                            title: "Files Uploaded 2017-01-04 (Transaction 38112)",
                                            key: "38112", folder: true, lazy: true
                                        },
                                        {
                                            title: "Files Uploaded 2017-01-15 (Transaction 39233)",
                                            key: "39233", folder: true, lazy: true
                                        },
                                        {
                                            title: "Files Uploaded 2017-02-02 (Transaction 40999)",
                                            key: "40999", folder: true, lazy: true
                                        }
                                    ]
                                }
                            ]

                        }
                    ]
                });
            // });
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
