<?php

namespace PacificaSearchBundle\Repository;


use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;

class InstrumentRepository extends Repository
{
    /**
     * @inheritdoc
     */
    protected function getType()
    {
        return ElasticSearchQueryBuilder::TYPE_INSTRUMENT;
    }
}