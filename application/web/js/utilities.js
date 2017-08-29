(function ($, undefined) {
    "use strict";
    if (undefined !== PacificaSearch.Utilities) {
        throw new Error("PacificaSearch.Utilities is already defined, did you include this file twice?");
    }

    PacificaSearch.Utilities = {

        /**
         * Generate an error if a jQuery selector fails to find a match, otherwise return its result
         * @param selector
         */
        assertElementExists: function (selector) {
            var result = $(selector);
            if (!result.length) {
                throw new Error("Selector '" + selector + "' did not match any element");
            }
            return result;
        },

        /**
         * Replace all instances of <find> with <replace> in <string>
         * @param {string} str
         * @param {string} find
         * @param {string} replace
         * @return {string}
         */
        replaceAll: function (str, find, replace) {
            // This solution is a bit slower than using a RegExp but doesn't require escaping special characters.
            // We can replace it with a RegExp-based solution if there is ever a need for this method to work faster.
            return str.split(find).join(replace);
        },

        /**
         * Returns a new Array containing all elements that are in both a and b
         * @param {Array} a
         * @param {Array} b
         */
        arrayIntersection: function (a, b) {
            return a.filter(function(n) {
                return b.indexOf(n) !== -1;
            });
        },

        /**
         * Returns a Promise that resolves when all of the passed Promises have resolved.
         * @param {promise[]} promises
         */
        allResolved: function (promises) {
            var deferred = $.Deferred();
            var numUnresolved = promises.length;

            if (numUnresolved == 0) {
                deferred.resolve();
            }

            promises.forEach(function (promise) {
                promise.then(function () {
                    numUnresolved--;
                    if (numUnresolved == 0) {
                        deferred.resolve();
                    }
                });
            });

            return deferred.promise();
        }
    };
})(jQuery);
