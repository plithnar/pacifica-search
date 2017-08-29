(function (PacificaSearch, $, undefined) {
    "use strict";
    if (undefined !== PacificaSearch.QueryDispatcher) {
        throw new Error("PacificaSearch.QueryDispatcher is already defined, did you include this file twice?");
    }

    /**
     * Gets the Elasticsearch client.
     *
     * See https://www.elastic.co/guide/en/elasticsearch/client/javascript-api for documentation of the client class
     *
     * @returns {$.es.Client}
     */
    var _client;
    function _getClient() {
        if (!_client) {
            _client = new $.es.Client({
                host: "localhost:9200"
            });

            // Confirm that the client is able to reach the ES cluster. This is asynchronous, but we'll be optimistic and
            // just return the client instead of requiring callers to handle a Promise.
            _client.ping({
                requestTimeout: 30000
            }, function (error) {
                if (error) {
                    throw new Error("Elasticsearch cluster is not reachable!");
                }
                else {
                    console.log("Reached Elasticsearch cluster - all is well.");
                }
            });
        }

        return _client;
    }

    /**
     * Convert a set of query results into a simple map
     * @param {PacificaSearch.Result[]} results
     * @param {string=id} from
     * @param {string=name} to
     * @return {object[]} Like [{<id> : <name>}, ...]
     */
    function _resultsToMap(results, from, to) {
        from = from || "id";
        to = to || "name";

        var map = {};
        results.forEach(function (result) {
            map[result[from]] = result[to];
        });
        return map;
    }

    /**
     * PacificaSearch.QueryDispatcher - A singleton that submits PacificaSearch.Query instances to the Elasticsearch
     * interface and packages the responses as PacificaSearch.Response instances.
     */
    PacificaSearch.QueryDispatcher = {

        /**
         * @param {PacificaSearch.Query} query
         * @return {$.promise} When the promise resolves it is passed an array of PacificaSearch.Result
         */
        getResults: function (query) {
            var deferred = $.Deferred();
            var queryObj = query.toObj();

            console.log("Submitting to Elasticsearch: " + JSON.stringify(queryObj));

            _getClient()
                .search(queryObj)
                .then(function (response) {
                    var results = response.hits.hits.map(function (hit) {
                        return new PacificaSearch.Result(hit._id, hit._type, hit._source);
                    });

                    deferred.resolve(results);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });

            return deferred.promise();
        },

        /**
         * Like getResults, but instead of fetching a whole set of Result instances, just gets a single
         * key from each Result
         *
         * @param {PacificaSearch.Query} query
         * @param {string} key
         * @return {$.promise} When the promise resolves it is passed an array of values corresponding
         *     to the "key" argument
         */
        getSingleResultValue: function (query, key) {
            var deferred = $.Deferred();

            this.getResults(query)
                .then(function (results) {
                    var values = results.map(function (result) {
                        return result[key];
                    });

                    deferred.resolve(values);
                });

            return deferred.promise();
        },

        /**
         * Like getResults, but instead of fetching a whole set of Result instances, just gets a simple map of one field
         * to another (by default id to name)
         *
         * @param {PacificaSearch.Query} query
         * @param {string=id} from
         * @param {string=name} to
         * @return {$.promise} When the promise resolves it is passed an array of objects like {<id> : <name>}
         */
        getResultsAsMap: function (query, from, to) {
            var deferred = $.Deferred();
            var map;

            this.getResults(query).then(function (results) {
                map = _resultsToMap(results, from, to);
                deferred.resolve(map);
            });

            return deferred.promise();
        }
    };
})(PacificaSearch, jQuery);
