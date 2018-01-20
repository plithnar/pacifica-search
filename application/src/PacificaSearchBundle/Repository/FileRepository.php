<?php

namespace PacificaSearchBundle\Repository;

use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\File;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;

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

    /**
     * Files can be the results of a filter, but they cannot be filtered on themselves
     *
     * @inheritdoct
     */
    protected function isFilterRepository()
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    protected static function getNameFromSearchResult(array $result)
    {
        return $result['_source']['subdir'] . '/' . $result['_source']['name'];
    }

    /**
     * Retrieves the Files associated with a Transaction
     *
     * @param $transactionId
     * @return ElasticSearchTypeCollection
     */
    public function getByTransactionId($transactionId)
    {
        $qb = $this->getQueryBuilder()->whereEq('transaction_id', $transactionId);
        $fileArrays = $this->searchService->getResults($qb);
        $files = $this->resultsToTypeCollection($fileArrays);
        return $files;
    }
}
