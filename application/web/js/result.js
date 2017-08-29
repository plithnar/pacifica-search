(function (PacificaSearch, undefined) {
    "use strict";

    if (undefined !== PacificaSearch.Result) {
        throw new Error("PacificaSearch.Result is already defined, did you include this file twice?");
    }

    /**
     * @class PacificaSearch.Result - Represents an Elasticsearch query result.
     *
     * This class is really little more than a dumb Object as currently implemented. The
     * id and type properties will always be set, but the rest of the instance's properties
     * are simply set based on the structure of the underlying Elasticsearch database object.
     * For now we'll simply rely on duck typing based on the type.
     *
     * TODO: If we want to get all fancy we can make this an abstract class later and have Model representations
     * of our data types. That would be better(tm), but for now it seems like overkill.
     * );
     */
    PacificaSearch.Result = function (id, type, fieldValues) {
        this.id = id;
        this.type = type;

        // This is where the duck typing comes in - we just throw new properties onto the instance
        // based on whatever we are passed.
        var self = this;
        Object.keys(fieldValues).forEach(function (fieldName) {
            self[fieldName] = fieldValues[fieldName];
        });
    };
})(PacificaSearch);
