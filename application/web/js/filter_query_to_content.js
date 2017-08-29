(function($, $$, undefined) {
    if (undefined !== PacificaSearch.FilterQueryToContent) {
        throw new Error("PacificaSearch.FilterQueryToContent is already defined, did you include this file twice?");
    }

    var Dispatcher = PacificaSearch.QueryDispatcher;
    var Utilities = PacificaSearch.Utilities;

    /**
     * Given a map of records' IDs to their names, resets the contents of that record type to contain the options in
     * that map.
     *
     * @param {Object} idToNameMap A map in the form { id : name, ... }
     * @param {string} type The identifier of the data type in HTML
     */
    function _renderEntriesForIdToNameMap(idToNameMap, type) {
        var template = $$('[data-pacifica-search-template="' + type + '"]');
        var entries = [];

        // Copy the template object and replace the %placeholder% strings with values from the record
        Object.keys(idToNameMap).forEach(function (resultId) {
            var option = template.clone();
            var optionHtml = option.html();
            optionHtml = Utilities.replaceAll(optionHtml, '%id%', resultId);
            optionHtml = Utilities.replaceAll(optionHtml, '%name%', idToNameMap[resultId]);

            entries.push(optionHtml);
        });

        return entries;
    }

    /**
     * This is the standard handler for the FilterQueryToContent object.
     * @param {string} type
     * @param {PacificaSearch.Query} q
     * @param {string=} nameField If the "name" you want your IDs mapped to has a different field name than "name", pass the
     *     name of the field here.
     * @returns $.Promise When resolved, {string[]} is passed.
     */
    function _renderQueryAsIdToNameMap(type, q, nameField) {
        var deferred = $.Deferred();

        Dispatcher.getResultsAsMap(q, 'id', nameField)
            .then(function (resultsMap) {
                var entries = _renderEntriesForIdToNameMap(resultsMap, type);
                deferred.resolve(entries)
            });

        return deferred.promise();
    }

    /**
     * Collection of methods, one per Type, that accept a Query instance retrieving that Type's records and generate
     * the HTML representation of each option to be displayed in the page.
     *
     * Each method returns a $.Promise because they have to execute a Query, which is an asynchronous action
     */
    PacificaSearch.FilterQueryToContent = {
        /**
         * @param {PacificaSearch.Query} q
         * @returns $.Promise When resolved, {string[]} is passed.
         */
        InstrumentGroup : function (q) {
            return _renderQueryAsIdToNameMap("InstrumentGroup", q);
        },

        /**
         * @param {PacificaSearch.Query} q
         * @returns $.Promise When resolved, {string[]} is passed.
         */
        Instruments : function (q) {
            return _renderQueryAsIdToNameMap("Instruments", q);
        },

        /**
         * @param {PacificaSearch.Query} q
         * @returns $.Promise When resolved, {string[]} is passed.
         */
        Users : function (q) {
            var deferred = $.Deferred();

            Dispatcher.getResults(q)
                .then(function (users) {
                    var userIdsToFullNames = {};

                    users.forEach(function (u) {
                        userIdsToFullNames[u.id] = u.first_name + (u.middle_initial.length ? ' ' + u.middle_initial : '') + ' ' + u.last_name + ' (' + u.email_address + ')';
                    });

                    var entries = _renderEntriesForIdToNameMap(userIdsToFullNames, 'Users');
                    deferred.resolve(entries);
                });

            return deferred.promise();
        },

        /**
         * @param {PacificaSearch.Query} q
         * @returns $.Promise When resolved, {string[]} is passed.
         */
        Institutions : function (q) {
            return _renderQueryAsIdToNameMap("Institutions", q);
        },

        /**
         * @param {PacificaSearch.Query} q
         * @returns $.Promise When resolved, {string[]} is passed.
         */
        Proposals : function (q) {
            return _renderQueryAsIdToNameMap("Proposals", q, 'title');
        },

        /**
         * @param {PacificaSearch.Query} q
         * @returns $.Promise When resolved, {string[]} is passed.
         */
        Files : function (q) {
            var deferred = $.Deferred();

            // q is sometimes NULL because we don't always generate a Query for Files.
            if (q) {
                Dispatcher.getResults(q)
                    .then(function (files) {
                        var fileIdsToPaths = {};

                        files.forEach(function (f) {
                            fileIdsToPaths[f.id] = f.subdir + ' ' + f.name;
                        });

                        var entries = _renderEntriesForIdToNameMap(fileIdsToPaths, 'Files');
                        deferred.resolve(entries);
                    });
            } else {
                deferred.resolve([]);
            }

            return deferred.promise();
        }
    };
})(jQuery, PacificaSearch.Utilities.assertElementExists);