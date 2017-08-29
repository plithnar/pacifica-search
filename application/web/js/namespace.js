/**
 * namespace.js - Defines namespace objects and global constants for the Pacifica Search project
 */
(function (undefined) {
    if (undefined !== window.PacificaSearch) {
        throw new Error('PacificaSearch is already defined, did you include this file twice?');
    }

    window.PacificaSearch = {
        TYPE : {
            INSTRUMENT_GROUP : 'InstrumentGroup',
            INSTRUMENT : 'Instruments',
            INSTITUTION : 'Institutions',
            INSTITUTION_PERSON : 'InstitutionPerson',
            PROPOSAL : 'Proposals',
            USER : 'Users',
            FILE : 'Files',
            TRANSACTION : 'Transactions',
            GROUP : 'Groups'
        }
    };
})();