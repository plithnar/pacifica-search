(function (PacificaSearch, undefined) {
    "use strict";

    if (undefined !== PacificaSearch.Query) {
        throw new Error("PacificaSearch.Query is already defined, did you include this file twice?");
    }

    /**
     * @class PacificaSearch.Query - Represents an Elasticsearch query
     * @param {string} type Must be one of the PacificaSearch.TYPE.* constants
     */
    PacificaSearch.Query = function (type) {
        if (Object.values(PacificaSearch.TYPE).indexOf(type) == -1) {
            throw new Error('Unexpected type "' + type + '"');
        }

        /** @property {Number[]} */
        this._ids = [];

        /** @property {string} If set, request results only from the matching type */
        this._type = type;

        /** @property {Number} How many records to retrieve */
        this._size = 2000;

        /** @property {Object} Map of field names to arrays of values that those fields must contain to be returned */
        this._fields = {};
    };

    /**
     * Constrain this query's results to those having one of the passed IDs.
     * @param {Number|Number[]} ids
     * @returns {PacificaSearch.Query}
     */
    PacificaSearch.Query.prototype.byId = function (ids) {
        this._ids = ids;
        return this;
    };

    /**
     * Constrain this query's results to those matching the type
     * @param {Number} limit
     * @returns {PacificaSearch.Query}
     */
    PacificaSearch.Query.prototype.limit = function (limit) {
        this._size = limit;
        return this;
    };

    /**
     * Equivalent to SQL "WHERE {fieldName} = {value}"
     *
     * @param {string} fieldName
     * @param {string|string[]} value
     * @returns {PacificaSearch.Query}
     */
    PacificaSearch.Query.prototype.whereEq = function (fieldName, value) {
        if (fieldName == 'id') return this.byId(value);

        if (undefined !== this._fields[fieldName]) {
            console.error("There is already a constraint on field " + fieldName + ", you cannot then also add a whereEq on that field");
        }

        this._fields[fieldName] = Array.isArray(value) ? value : [ value ];

        return this;
    };

    /**
     * whereIn() is an alias of whereEq() that's offered for readability
     */
    PacificaSearch.Query.prototype.whereIn = PacificaSearch.Query.prototype.whereEq;

    /**
     * Get the query in an object suitable for passing to the search() method of an instance of $.es.Client
     * @returns {Object}
     */
    PacificaSearch.Query.prototype.toObj = function () {
        var obj = {
            index: 'pacifica',
            type: this._type,
            body: {
                size: this._size
            }
        };

        if (this._ids.length) {
            if (undefined == obj.body.query) obj.body.query = {};

            obj.body.query.ids = {
                type: this._type,
                values: this._ids
            };
        }

        var fieldNames = Object.keys(this._fields);
        if (fieldNames.length) {
            var fields = this._fields;

            if (undefined == obj.body.query) obj.body.query = {};
            if (undefined == obj.body.query.bool) obj.body.query.bool = {};
            if (undefined == obj.body.query.bool.filter) obj.body.query.bool.filter = {};
            if (undefined == obj.body.query.bool.filter.terms) obj.body.query.bool.filter.terms = {};

            fieldNames.forEach(function (fieldName) {
                obj.body.query.bool.filter.terms[fieldName] = fields[fieldName];
            });
        }

        return obj;
    };
})(PacificaSearch);
