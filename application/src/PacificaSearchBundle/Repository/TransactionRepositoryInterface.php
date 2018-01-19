<?php

namespace PacificaSearchBundle\Repository;


use PacificaSearchBundle\Filter;

interface TransactionRepositoryInterface
{
    /**
     * @param string $modelClass Pass e.g. InstitutionRepository::class
     * @return int[]
     */
    public function getIdsOfTypeAssociatedWithAtLeastOneTransaction($modelClass) : array;

    /**
     * Retrieves the IDs of Transactions that are associated with at least one record of each type in the passed filter.
     * That is to say, if the filter has InstrumentTypes 1, 2, 3, and Institutions 5, 6, and 7, then this will retrieve
     * the IDs of all Transactions associated with ( (Instrument Type 1 OR 2 OR 3) AND (Institution 5 OR 6 OR 7) )
     * @param Filter $filter
     * @return int[]
     */
    public function getIdsByFilter(Filter $filter) : array;
}