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
            $results = $this->searchService->getResults($qb);

            if (empty($results)) {
                throw new \RuntimeException("The Transactions type in the Elasticsearch DB appears to be empty.");
            }

            foreach($results as $result) {
                $vals = $result['_source'];
                $this->idsByModel[User::class][$vals['submitter']] = $vals['submitter'];
                $this->idsByModel[Instrument::class][$vals['instrument']] = $vals['instrument'];
                $this->idsByModel[Proposal::class][$vals['proposal']] = $vals['proposal'];
            }

            $instrumentTypeQb = $this->searchService->getQueryBuilder(ElasticSearchQueryBuilder::TYPE_GROUP)
                ->whereIn('instrument_members.instrument_id', $this->idsByModel[Instrument::class]);
            $this->idsByModel[InstrumentType::class] = $this->searchService->getIds($instrumentTypeQb);

            $institutionQb = $this->searchService->getQueryBuilder(ElasticSearchQueryBuilder::TYPE_INSITUTION)
                ->whereIn('users.person_id', $this->idsByModel[User::class]);
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

        // Proposals
        $proposalIds = $filter->getProposalIds();
        if (count($proposalIds)) {
            $qb->whereEq('proposal', $proposalIds);
        }

        // Instruments/Instrument Types
        // If both Instruments and Instrument Types are included in the filter, we disregard the Instrument Types, since
        // Instrument Types are essentially just groups of Instruments, and the result of combining them is always either
        // the same as just filtering by Instruments, or an empty set (if only users not belonging to any institution in
        // the filter are passed).
        $instrumentIds = $filter->getInstrumentIds();
        if (!count($instrumentIds)) {
            $instrumentTypeIds = $filter->getInstrumentTypeIds();
            if (count($instrumentTypeIds)) {
                $instrumentIds = $this->repositoryManager->getInstrumentRepository()->getIdsByType($instrumentTypeIds);
            }
        }
        if (count($instrumentIds)) {
            $qb->whereEq('instrument', $instrumentIds);
        }

        // Users/Institutions
        // Similar to Instruments and Instrument Types, If both institutions and users are included in the filter, then
        // we disregard the institutions.
        $userIds = $filter->getUserIds();
        if (!count($userIds)) {
            $institutionIds = $filter->getInstitutionIds();
            if (count($institutionIds)) {
                $userIds = $this->repositoryManager->getUserRepository()->getIdsByInstitution($institutionIds);
            }
        }
        if (count($userIds)) {
            $qb->whereEq('submitter', $userIds);
        }

        $transactionIds = $this->searchService->getIds($qb);
        return $transactionIds;
    }
}