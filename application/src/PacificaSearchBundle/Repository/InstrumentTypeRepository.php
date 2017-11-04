<?php

namespace PacificaSearchBundle\Repository;

use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;

class InstrumentTypeRepository extends Repository
{
    /**
     * @inheritdoc
     */
    protected function getType()
    {
        // TYPE_GROUP is not intuitive, but InstrumentType isn't a type of its own in ElasticSearch. Rather, it is the
        // subset of Group entries that have a relationship with the Instruments type
        return ElasticSearchQueryBuilder::TYPE_GROUP;
    }

    /**
     * @inheritdoc
     */
    protected function getQueryBuilderForAllRecords()
    {
        return parent::getQueryBuilderForAllRecords()->whereNestedFieldExists('instrument_members.instrument_id');
    }
}