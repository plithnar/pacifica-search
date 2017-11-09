<?php

namespace PacificaSearchBundle\Repository;

use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;

class InstrumentTypeRepository extends FilterRepository
{
    /**
     * Gets the IDs of a set of InstrumentTypes associated with a set of Instruments
     * @param int[] $instrumentIds
     * @return int[]
     */
    public function getIdsByInstrumentIds(array $instrumentIds)
    {
        $qb = $this->getQueryBuilder()->whereIn('instrument_members.instrument_id', $instrumentIds);

        $ids = $this->searchService->getIds($qb);

        // TODO: Figure out how to make this a unique query instead of uniquing it afterward
        return array_values(array_unique($ids));
    }

    /**
     * @inheritdoc
     */
    protected function getOwnIdsFromTransactionResults(array $transactionResults)
    {
        $instrumentRepository = $this->repositoryManager->getInstrumentRepository();
        $instrumentIds = $instrumentRepository->getOwnIdsFromTransactionResults($transactionResults);
        $ids = $this->getIdsByInstrumentIds($instrumentIds);
        return $ids;
    }

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
    protected function getQueryBuilder()
    {
        return parent::getQueryBuilder()->whereNestedFieldExists('instrument_members.instrument_id');
    }
}