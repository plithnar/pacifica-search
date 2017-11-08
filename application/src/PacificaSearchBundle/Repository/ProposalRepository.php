<?php

namespace PacificaSearchBundle\Repository;


use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;

class ProposalRepository extends Repository
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
        return ElasticSearchQueryBuilder::TYPE_PROPOSAL;
    }

    /**
     * @inheritdoc
     */
    protected static function getNameFromSearchResult(array $result)
    {
        return $result['_source']['title'];
    }
}