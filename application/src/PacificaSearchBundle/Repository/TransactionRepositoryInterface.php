<?php

namespace PacificaSearchBundle\Repository;

use PacificaSearchBundle\Filter;

interface TransactionRepositoryInterface
{
    /**
     * Retrieves the IDs of Transactions that are associated with at least one record of each type in the passed filter.
     * That is to say, if the filter has InstrumentTypes 1, 2, 3, and Institutions 5, 6, and 7, then this will retrieve
     * the IDs of all Transactions associated with ( (Instrument Type 1 OR 2 OR 3) AND (Institution 5 OR 6 OR 7) )
     * @param Filter $filter
     * @return int[]
     */
    public function getIdsByFilter(Filter $filter) : array;

    /**
     * Gets a set of associative arrays representing the Transactions fitting a filter
     *
     * @param Filter $filter
     * @return array
     */
    public function getAssocArrayByFilter(Filter $filter) : array;

    /**
     * Retrieves the IDs of all transactions matching a text search. Because Transactions contain the searchable texts
     * of all related Persons, Proposals, etc, this gives us the set of all Transactions with a relationship to any
     * searchable type that matches the search.
     *
     * @param string $searchString
     * @return int[]
     */
    public function getIdsByTextSearch(string $searchString) : array;
}
