<?php

namespace PacificaSearchBundle\Repository;

use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;

class ProposalRepository extends Repository
{
    /**
     * @inheritdoc
     */
    public function getOwnIdsFromTransactionResults(array $transactionResults)
    {
        $ids = array_map(function ($result) {
            return (int) $result['_source']['proposal'];
        }, $transactionResults);
        return $ids;
    }

    /**
     * Gets a set of the IDs of all instances that are consistent with the passed Filter.
     *
     * Note that this method differs from getFilterIdsConsistentWithFilter() in that we *do* allow the type to filter
     * itself. The concrete reason for that difference is that we use this method to get That is because it is possible
     * for a user to select Proposals in the Filter in order to reduce the set of Proposals shown in the file tree.
     *
     * @param Filter $filter
     * @return array
     */
    public function getFilteredIds(Filter $filter) : array
    {
        $transactionIds = $this->repositoryManager->getTransactionRepository()->getIdsByFilter($filter);
        return $this->getIdsByTransactionIds($transactionIds);
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
        return "Proposal #" . $result['_id'];
    }
}
