<?php

namespace PacificaSearchBundle\Repository;


use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;

class InstitutionRepository extends Repository
{
    /**
     * @inheritdoc
     */
    protected function getType()
    {
        return ElasticSearchQueryBuilder::TYPE_INSITUTION;
    }
}