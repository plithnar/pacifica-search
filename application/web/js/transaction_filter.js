(function ($, $$, undefined) {
    if (undefined !== PacificaSearch.TransactionFilter) {
        throw new Error("PacificaSearch.TransactionFilter is already defined, did you include this file twice?");
    }

    var arrayIntersection = PacificaSearch.Utilities.arrayIntersection;
    var allResolved = PacificaSearch.Utilities.allResolved;

    /**
     * Represents the collection of filter options that the user has entered in the UI.
     */
    PacificaSearch.TransactionFilter = function () {
        this.InstrumentGroup = [];
        this.Instruments = [];
        this.Institutions = [];
        this.Proposals = [];
        this.Users = [];
    };

    /**
     * Retrieves the set of TransactionIds that pass every item of the filter. The logic is that multiple items
     * in the same filter type are treated as ORs, but items from different types are ANDs. So if you've selected
     * InstrumentGroups "NMR" and "Calorimiter" and Users "Bob" and "Sally", then the result will the be IDs of
     * Transactions that pass the logic: (Instrument group is "NMR" OR Calorimiter) AND (User is "Bob" OR "Sally")
     *
     * @returns $.Promise When the promise resolves, an array of transactionIds is passed, or NULL if no filters
     *     were defined
     */
    PacificaSearch.TransactionFilter.prototype.getTransactionIds = function() {
        var deferred = $.Deferred();
        var self = this;
        var promises = [];

        // We will only apply filters that have IDs in them - empty filters are ignored
        var filtersToApply = Object.keys(this).filter(function (key) {
            return self[key].length > 0;
        });

        var transactionIds = null;
        filtersToApply.forEach(function (type) {
            var ids = self[type];
            var reverseFilter = PacificaSearch.ReverseFilter[type];

            if (typeof (reverseFilter) != 'function') {
                throw new Error('PacificaSearch.ReverseFilter[' + type + '] is not a function!');
            }

            var promise = reverseFilter(ids);
            promise.then(function (idsFromFilter) {
                transactionIds = (null === transactionIds ? idsFromFilter : arrayIntersection(transactionIds, idsFromFilter));
            });
            promises.push(promise);
        });

        allResolved(promises).then(function () {
            deferred.resolve(transactionIds);
        });

        return deferred.promise();
    };
})(jQuery, PacificaSearch.Utilities.assertElementExists);