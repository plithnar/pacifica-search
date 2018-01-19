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
use PacificaSearchBundle\Service\RepositoryManager;
use PacificaSearchBundle\Service\SearchService;

/**
 * Class TransactionRepository
 *
 * Note that the TransactionRepository doesn't inherit from Repository - this is because Transactions are not used
 * in a similar way to any of the other data types. They are only queried to retrieve their IDs, and so there is no
 * corresponding Model class to represent them, and this class doesn't have to perform any of the duties the other
 * repositories have to do.
 */
class TransactionRepository
{
    /** @var SearchService */
    protected $searchService;

    /** @var RepositoryManager */
    protected $repositoryManager;

    /**
     * @var array[] in the form
     * [
     *   TYPE_NAME => [id, id, id, ...],
     *   ...
     * ]
     *
     * TYPE_NAME values are one of the ElasticSearchQueryBuilder::TYPE_* constants
     */
    private $idsByModel;

    public function __construct(
        SearchService $searchService,
        RepositoryManager $repositoryManager
    ) {
        $this->searchService = $searchService;
        $this->repositoryManager = $repositoryManager;
    }

    /**
     * @param string $modelClass Pass e.g. InstitutionRepository::class
     * @return int[]
     */
    public function getIdsOfTypeAssociatedWithAtLeastOneTransaction($modelClass)
    {
        // TODO: This is an optimization problem. At the very least we need to turn this into a scan & scroll operation,
        // but with a very large database we really should just ensure that there are no records not associated with at
        // least one Transaction. Until I know whether the production database will actually have orphaned records, though,
        // this is just going to be a brute force retrieval.
        if (!$this->idsByModel) {
            $qb = $this->searchService->getQueryBuilder(ElasticSearchQueryBuilder::TYPE_TRANSACTION);
            $results = $this->searchService->getResults($qb, true);

            foreach ($results as $result) {
                $vals = $result['_source'];
                $this->idsByModel[User::class][$vals['submitter']] = $vals['submitter'];
                $this->idsByModel[Instrument::class][$vals['instrument']] = $vals['instrument'];
                $this->idsByModel[Proposal::class][$vals['proposal']] = $vals['proposal'];
            }

            $instrumentTypeQb = $this->searchService->getQueryBuilder(ElasticSearchQueryBuilder::TYPE_GROUP)
                ->whereIn('instruments', $this->idsByModel[Instrument::class]);
            $this->idsByModel[InstrumentType::class] = $this->searchService->getIds($instrumentTypeQb);

            $institutionQb = $this->searchService->getQueryBuilder(ElasticSearchQueryBuilder::TYPE_INSITUTION)
                ->whereIn('users', $this->idsByModel[User::class]);
            $this->idsByModel[Institution::class] = $this->searchService->getIds($institutionQb);

            $this->idsByModel[File::class] = []; // Not relevant since all files have a transaction, this is just to circumvent the otherwise helpful error message below
        }

        if (!isset($this->idsByModel[$modelClass])) {
            throw new \InvalidArgumentException("$modelClass is not a valid class for this method - it's either not a class that has a relationship to Transactions or it hasn't been implemented in this method yet");
        }

        return $this->idsByModel[$modelClass];
    }

    /**
     * Retrieves the IDs of Transactions that are associated with at least one record of each type in the passed filter.
     * That is to say, if the filter has InstrumentTypes 1, 2, 3, and Institutions 5, 6, and 7, then this will retrieve
     * the IDs of all Transactions associated with ( (Instrument Type 1 OR 2 OR 3) AND (Institution 5 OR 6 OR 7) )
     * @param Filter $filter
     * @return int[]
     */
    public function getIdsByFilter(Filter $filter)
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
