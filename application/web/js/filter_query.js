(function($, $$, undefined) {
    if (undefined !== PacificaSearch.FilterQuery) {
        throw new Error("PacificaSearch.FilterQuery is already defined, did you include this file twice?");
    }

    var Dispatcher = PacificaSearch.QueryDispatcher;
    var Query = function (type) { return new PacificaSearch.Query(type); };
    var TYPE = PacificaSearch.TYPE;

    /**
     * Gets the IDs of the instruments associated with a set of transactions
     *
     * @param transactionIds
     * @returns $.Promise When resolved, a collection of instrument IDs is passed
     * @private
     */
    function _getInstrumentIdsByTransactionIds(transactionIds) {
        var deferred = $.Deferred();

        var transactionQuery = Query(TYPE.TRANSACTION).byId(transactionIds);
        Dispatcher.getSingleResultValue(
            transactionQuery,
            'instrument'
        ).then (function (instrumentIds) {
            deferred.resolve(instrumentIds);
        });

        return deferred.promise();
    }

    /**
     * The inverse of _getInstrumentIdsByTransactionIds
     *
     * @param {array} instrumentIds
     * @returns $.Promise When resolved, a collection of transaction IDs is passed
     * @private
     */
    function _getTransactionIdsByInstrumentIds(instrumentIds) {
        var deferred = $.Deferred();

        var transactionQuery = Query(TYPE.TRANSACTION).whereIn('instrument', instrumentIds);
        Dispatcher.getSingleResultValue(
            transactionQuery,
            'id'
        ).then (function (transactionIds) {
            deferred.resolve(transactionIds);
        });

        return deferred.promise();
    }

    function _getIdsByCrossTableDependency(joinType, dependencyIds, ownIdFieldName, dependencyIdFieldName) {
        var deferred = $.Deferred();

        if (dependencyIds && dependencyIds.length) {
            Dispatcher.getSingleResultValue(
                Query(joinType).whereIn(dependencyIdFieldName, dependencyIds),
                ownIdFieldName
            ).then(function (ownIds) {
                deferred.resolve(ownIds);
            });
        } else {
            deferred.resolve(null);
        }

        return deferred.promise();
    }

    /**
     * Given a Query, this method will add a "byId" clause that causes the query to select for entries that match a
     * cross-table Type relationship. So for example, the below statement can be read as "Retrieve the Instruments
     * records filtered by InstrumentGroups with IDs 1, 2 or 3, as defined by their relationship in the InstrumentGroup
     * table, where they are identified by the instrument_id and group_id fields, respectively"
     *
     * _getQueryToSelectRecordsByCrossTableDependency(
     *     PacificaSearch.TYPE.INSTRUMENT,
     *     PacificaSearch.TYPE.INSTRUMENT_GROUP,
     *     [1, 2, 3],
     *     'instrument_id',
     *     'group_id'
     * ).then(function (instrumentQuery) {
     *   // Do something
     * });
     *
     * @param {string} typeToSelect The Type that the generated query will return
     * @param {string} crossTableType The Type that represents the cross-table relationship between ownType and the dependency type
     * @param {Array} dependencyIds The IDs of the dependency Type that should be used to filter the results in the generated query
     * @param {string} typeToSelectIdFieldName The name of the field storing the ID of typeToSelect in the crossTableType records
     * @param {string} dependencyIdFieldName The name of the field storing the dependency type ID in the crossTableType records
     * @returns $.Promise When resolved, the updated instance of PacificaSearch.Query is passed.
     */
    function _getQueryToSelectRecordsByCrossTableDependency(typeToSelect, crossTableType, dependencyIds, typeToSelectIdFieldName, dependencyIdFieldName) {
        var deferred = $.Deferred();

        var query = Query(typeToSelect);

        // To make the lives of our callers easier, we allow passing an empty set of dependency IDs, in which case no
        // filtering will be done at all.
        if (dependencyIds && dependencyIds.length) {
            _getIdsByCrossTableDependency(crossTableType, dependencyIds, typeToSelectIdFieldName, dependencyIdFieldName).then(function (ids) {
                deferred.resolve(query.byId(ids));
            });
        } else {
            deferred.resolve(query);
        }

        return deferred.promise();
    }

    /**
     * Collection of factory methods that generate Query instances that represent filters that will retrieve the
     * records required to display a particular Type's options. Each method accepts a collection of the IDs of all
     * Transactions that are in the current user filter, and returns a $.Promise that, when resolved, will pass an
     * instance of PacificaSearch.Query.
     *
     * The reason these must be implemented as asynchronous is to allow for Types that have to execute Queries in the
     * course of generating the filter Query.
     */
    PacificaSearch.FilterQuery = {
        /**
         * The relationship of Transactions to InstrumentGroups is:
         *
         * Transaction -> Instrument -> InstrumentGroup -> Groups
         *
         * @param {Array} transactionIds
         * @returns $.Promise When resolved, an instance of PacificaSearch.Query is passed that returns a collection of
         *     type Groups.
         */
        InstrumentGroup : function (transactionIds) {
            var deferred = $.Deferred();

            if (!transactionIds || !transactionIds.length) {
                var instrumentGroupQuery = Query(TYPE.INSTRUMENT_GROUP);
                Dispatcher.getSingleResultValue(instrumentGroupQuery, 'group_id').then(function (groupIds) {
                    var groupQuery = Query(TYPE.GROUP).byId(groupIds);
                    deferred.resolve(groupQuery);
                });
            } else {
                _getInstrumentIdsByTransactionIds(transactionIds)
                    .then(function (instrumentIds) {
                        return _getQueryToSelectRecordsByCrossTableDependency(
                            TYPE.GROUP,
                            TYPE.INSTRUMENT_GROUP,
                            instrumentIds,
                            'group_id',
                            'instrument_id'
                        );
                    }).then(function (groupQuery) {
                        deferred.resolve(groupQuery);
                    });
            }

            return deferred.promise();
        },

        /**
         * The relationship of Transactions to Instruments is:
         *
         * Transaction -> Instrument
         *
         * @param {Array} transactionIds
         * @returns $.Promise When resolved, an instance of PacificaSearch.Query is passed that returns a collection of
         *     type Groups.
         */
        Instruments : function (transactionIds) {
            return _getQueryToSelectRecordsByCrossTableDependency(
                TYPE.INSTRUMENT,
                TYPE.TRANSACTION,
                transactionIds,
                'instrument',
                'id'
            );
        },

        /**
         * The relationship of Transactions to Users is:
         *
         * Transaction -> User (via Transaction.submitter)
         *
         * @param {Array} transactionIds
         * @returns $.Promise When resolved, an instance of PacificaSearch.Query is passed that returns a collection of
         *     type Groups.
         */
        Users : function (transactionIds) {
            return _getQueryToSelectRecordsByCrossTableDependency(
                TYPE.USER,
                TYPE.TRANSACTION,
                transactionIds,
                'submitter',
                'id'
            );
        },

        /**
         * The relationship of Transactions to Users is:
         *
         * Transaction -> User -> InstitutionPerson -> Institutions
         *
         * @param {Array} transactionIds
         * @returns $.Promise When resolved, an instance of PacificaSearch.Query is passed that returns a collection of
         *     type Institution.
         */
        Institutions : function (transactionIds) {
            var deferred = $.Deferred();

            // If no transactions are to be filtered on (IE there is no filter) then just return all Institutions
            if (!transactionIds || !transactionIds.length) {
                var institutionQuery = Query(TYPE.INSTITUTION);
                deferred.resolve(institutionQuery);
            } else {
                // Get the IDs of Users associated with our Transactions
                _getIdsByCrossTableDependency(
                    TYPE.TRANSACTION,
                    transactionIds,
                    'submitter',
                    'id'
                )

                // From the user IDs, generate a query that returns Institutions via the InstitutionPerson cross-table relationship
                .then (function (userIds) {
                    return _getQueryToSelectRecordsByCrossTableDependency(
                        TYPE.INSTITUTION,
                        TYPE.INSTITUTION_PERSON,
                        userIds,
                        'institution_id',
                        'person_id'
                    )
                })

                .then (function (institutionQuery) {
                    deferred.resolve(institutionQuery);
                });
            }

            return deferred.promise();
        },

        /**
         * The relationship of Transactions to Proposals is:
         *
         * Transaction -> Proposal
         *
         * @param {Array} transactionIds
         * @returns $.Promise When resolved, an instance of PacificaSearch.Query is passed that returns a collection of
         *     type Proposals.
         */
        Proposals : function (transactionIds) {
            return _getQueryToSelectRecordsByCrossTableDependency(
                TYPE.PROPOSAL,
                TYPE.TRANSACTION,
                transactionIds,
                'proposal',
                'id'
            );
        },

        /**
        * The relationship of Transactions to Files is:
        *
        * File -> Transactions (via File.transaction_id)
        *
        * @param {Array} transactionIds
        * @returns $.Promise When resolved, an instance of PacificaSearch.Query is passed that returns a collection of
        *     type Proposals.
        */
        Files : function (transactionIds) {
            var deferred = $.Deferred();

            // Files are different than other Types in that, if there is no filter present, then we don't retrieve
            // any values.
            if (!transactionIds || transactionIds.length == 0) {
                deferred.resolve(null);
            } else {
                var fileQuery = Query(TYPE.FILE).whereIn('transaction_id', transactionIds);
                deferred.resolve(fileQuery);
            }

            return deferred.promise();
        }
    };

    /**
     * Similar to the FilterQuery object, but in reverse: Each of these takes a set of record IDs corresponding
     * to the Type after which the method is named, and returns the set of TransactionIDs that correspond to those
     * records.
     *
     * Note that there is no Files property - this is intentional, since it's not possible for the user to select
     * Files as part of their transaction filter.
     */
    PacificaSearch.ReverseFilter = {
        /**
         * The relationship of InstrumentGroups to Transactions is:
         *
         * Groups -> InstrumentGroup -> Instrument -> Transaction
         *
         * @param {Array} groupIds
         * @returns $.Promise When resolved, an array of TransactionIds is passed
         */
        InstrumentGroup : function (groupIds) {
            var deferred = $.Deferred();

            _getIdsByCrossTableDependency(
                TYPE.INSTRUMENT_GROUP,
                groupIds,
                'instrument_id',
                'group_id'
            ).then(function(instrumentIds) {
                return _getTransactionIdsByInstrumentIds(instrumentIds);
            }).then (function (transactionIds) {
                deferred.resolve(transactionIds)
            });

            return deferred.promise();
        },

        /**
         * The relationship of Instruments to Transactions is:
         *
         * Instrument -> Transaction
         *
         * @param {Array} instrumentIds
         * @returns $.Promise When resolved, an array of TransactionIds is passed
         */
        Instruments : function (instrumentIds) {
            var deferred = $.Deferred();

            _getIdsByCrossTableDependency(
                TYPE.TRANSACTION,
                instrumentIds,
                'id',
                'instrument'
            ).then (function (transactionIds) {
                deferred.resolve(transactionIds);
            });

            return deferred.promise();
        },

        /**
         * The relationship of Users to Transactions is:
         *
         * Transaction -> User (via Transaction.submitter)
         *
         * @param {Array} userIds
         * @returns $.Promise When resolved, an array of TransactionIds is passed
         */
        Users : function (userIds) {
            var deferred = $.Deferred();

            _getIdsByCrossTableDependency(
                TYPE.TRANSACTION,
                userIds,
                'id',
                'submitter'
            ).then (function (transactionIds) {
                deferred.resolve(transactionIds);
            });

            return deferred.promise();
        },

        /**
         * The relationship of Transactions to Users is:
         *
         * Institutions -> InstitutionPerson -> User -> Transaction
         *
         * @param {Array} institutionIds
         * @returns $.Promise When resolved, an array of TransactionIds is passed
         */
        Institutions : function (institutionIds) {
            var deferred = $.Deferred();

            // Get the IDs of Users based on the InstitutionPerson cross table
            _getIdsByCrossTableDependency(
                TYPE.USER,
                TYPE.INSTITUTION_PERSON,
                institutionIds,
                'person_id',
                'institution_id'
            ).then (function (userIds) {
                var transactionQuery = Query(TYPE.TRANSACTION).whereIn('submitter', userIds);
                return Dispatcher.getSingleResultValue(
                    transactionQuery,
                    'id'
                );
            }).then (function (transactionIds) {
                deferred.resolve(transactionIds);
            });
            return deferred.promise();
        },

        /**
         * The relationship of Proposals to Transactions is:
         *
         * Proposal -> Transaction
         *
         * @param {Array} proposalIds
         * @returns $.Promise When resolved, an array of TransactionIds is passed
         */
        Proposals : function (proposalIds) {
            var deferred = $.Deferred();

            _getIdsByCrossTableDependency(
                TYPE.TRANSACTION,
                proposalIds,
                'id',
                'proposal'
            ).then (function (transactionIds) {
                deferred.resolve(transactionIds);
            });

            return deferred.promise();
        }
    };
})(jQuery, PacificaSearch.Utilities.assertElementExists);