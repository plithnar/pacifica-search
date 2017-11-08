<?php

namespace PacificaSearchBundle\Repository;


use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;

class InstitutionRepository extends Repository
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
        return ElasticSearchQueryBuilder::TYPE_INSITUTION;
    }
}