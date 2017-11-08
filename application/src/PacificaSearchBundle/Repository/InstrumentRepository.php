<?php

namespace PacificaSearchBundle\Repository;


use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;

class InstrumentRepository extends Repository
{
    /**
     * @inheritdoc
     */
    public function getFilteredIds(Filter $filter)
    {
        return [];
    }

    /**
     * @inheritdoc
     */
    protected function getType()
    {
        return ElasticSearchQueryBuilder::TYPE_INSTRUMENT;
    }

    /**
     * Gets the IDs of all instruments belonging to a set of instrument types
     * @param int[] $instrumentTypeIds
     * @return int[]
     */
    public function getIdsByType(array $instrumentTypeIds)
    {
        $qb = $this->getQueryBuilder()->whereIn('groups.group_id', $instrumentTypeIds);
        $results = $this->searchService->getIds($qb);

        return $results;
    }
}