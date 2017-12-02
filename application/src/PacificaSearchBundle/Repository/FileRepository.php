<?php

namespace PacificaSearchBundle\Repository;

use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;

class FileRepository extends Repository
{
    /**
     * @inheritdoc
     */
    protected function getOwnIdsFromTransactionResults(array $transactionResults)
    {
        $transactionIds = array_map(function ($result) {
            return (int) $result['_id'];
        }, $transactionResults);

        $qb = $this->getQueryBuilder()->whereIn('transaction_id', $transactionIds);
        $fileIds = $this->searchService->getIds($qb);

        return $fileIds;
    }

    /**
     * @inheritdoc
     */
    protected function getType()
    {
        return ElasticSearchQueryBuilder::TYPE_FILE;
    }
}
