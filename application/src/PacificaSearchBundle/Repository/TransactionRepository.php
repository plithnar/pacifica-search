<?php

namespace PacificaSearchBundle\Repository;

use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\File;
use PacificaSearchBundle\Model\Institution;
use PacificaSearchBundle\Model\Instrument;
use PacificaSearchBundle\Model\InstrumentType;
use PacificaSearchBundle\Model\Proposal;
use PacificaSearchBundle\Model\User;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;
use PacificaSearchBundle\Service\RepositoryManagerInterface;
use PacificaSearchBundle\Service\SearchServiceInterface;

/**
 * Class TransactionRepository
 *
 * Note that the TransactionRepository doesn't inherit from Repository - this is because Transactions are not used
 * in a similar way to any of the other data types. They are only queried to retrieve their IDs, and so there is no
 * corresponding Model class to represent them, and this class doesn't have to perform any of the duties the other
 * repositories have to do.
 */
class TransactionRepository implements TransactionRepositoryInterface
{
    /** @var SearchServiceInterface */
    protected $searchService;

    /** @var RepositoryManagerInterface */
    protected $repositoryManager;

    public function __construct(
        SearchServiceInterface $searchService,
        RepositoryManagerInterface $repositoryManager
    ) {
        $this->searchService = $searchService;
        $this->repositoryManager = $repositoryManager;
    }

    /**
     * Retrieves the IDs of Transactions that are associated with at least one record of each type in the passed filter.
     * That is to say, if the filter has InstrumentTypes 1, 2, 3, and Institutions 5, 6, and 7, then this will retrieve
     * the IDs of all Transactions associated with ( (Instrument Type 1 OR 2 OR 3) AND (Institution 5 OR 6 OR 7) )
     * @param Filter $filter
     * @return int[]
     */
    public function getIdsByFilter(Filter $filter) : array
    {
        $qb = $this->searchService->getQueryBuilder(ElasticSearchQueryBuilder::TYPE_TRANSACTION);

        $this->addWhereClauseForProposals($qb, $filter->getProposalIds());
        $this->addWhereClauseForInstruments($qb, $filter->getInstrumentIds(), $filter->getInstrumentTypeIds());
        $this->addWhereClauseForUsers($qb, $filter->getUserIds(), $filter->getInstitutionIds());
        $transactionIds = $this->searchService->getIds($qb);

        return $transactionIds;
    }

    /**
     * Add a WHERE clause to a query builder so that it filters on a set of proposals
     * @param ElasticSearchQueryBuilder $qb
     * @param array $proposalIds
     */
    private function addWhereClauseForProposals(ElasticSearchQueryBuilder $qb, array $proposalIds)
    {
        if (count($proposalIds)) {
            $qb->whereEq('proposal', $proposalIds);
        }
    }

    /**
     * Add a WHERE clause to a query builder so that it filters on a set of instruments, based either on an explicit
     * list of instrument IDs or, failing that, on a list of instrument types
     * @param ElasticSearchQueryBuilder $qb
     * @param array $instrumentIds
     * @param array $instrumentTypeIds
     */
    private function addWhereClauseForInstruments(ElasticSearchQueryBuilder $qb, array $instrumentIds, array $instrumentTypeIds)
    {
        // Instruments/Instrument Types
        // If both Instruments and Instrument Types are included in the filter, we disregard the Instrument Types, since
        // Instrument Types are essentially just groups of Instruments, and the result of combining them is always either
        // the same as just filtering by Instruments, or an empty set (if only instruments not belonging to any type in
        // the filter are passed).
        if (!count($instrumentIds)) {
            if (count($instrumentTypeIds)) {
                $instrumentIds = $this->repositoryManager->getInstrumentRepository()->getIdsByType($instrumentTypeIds);
            }
        }
        if (count($instrumentIds)) {
            $qb->whereEq('instrument', $instrumentIds);
        }
    }

    /**
     * Add a WHERE clause to a query builder so that it filters on a set of users, based either on an explicit list of
     * user IDs or, failing that, on a list of institutions
     * @param ElasticSearchQueryBuilder $qb
     * @param array $userIds
     * @param array $institutionIds
     */
    private function addWhereClauseForUsers(ElasticSearchQueryBuilder $qb, array $userIds, array $institutionIds)
    {
        // Users/Institutions
        // Similar to Instruments and Instrument Types (see addWhereClauseForInstruments()), If both institutions and
        // users are included in the filter, then we disregard the institutions.
        if (!count($userIds)) {
            if (count($institutionIds)) {
                $userIds = $this->repositoryManager->getUserRepository()->getIdsByInstitution($institutionIds);
            }
        }
        if (count($userIds)) {
            $qb->whereEq('submitter', $userIds);
        }
    }
}
