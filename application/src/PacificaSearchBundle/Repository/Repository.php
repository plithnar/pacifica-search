<?php

namespace PacificaSearchBundle\Repository;

use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;
use PacificaSearchBundle\Service\RepositoryManagerInterface;
use PacificaSearchBundle\Service\SearchServiceInterface;

/**
 * Class Repository
 *
 * Base class for Pacifica Search repositories
 */
abstract class Repository
{
    const DEFAULT_PAGE_SIZE = 10;

    /** @var SearchServiceInterface */
    protected $searchService;

    /** @var RepositoryManagerInterface */
    protected $repositoryManager;

    final public function __construct(SearchServiceInterface $searchService, RepositoryManagerInterface $repositoryManager)
    {
        $this->searchService = $searchService;
        $this->repositoryManager = $repositoryManager;
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
     * Gets the name of the model class of the type that this repository is responsible for. Will attempt to find the
     * class by the convention that repository classes are named <ModelClass>Repository, override this method if that's
     * not the case.
     *
     * @throws \Exception
     */
    public function getModelClass() : string
    {
        // Remove the "Repository" suffix from the repo's class name
        $modelClassName = preg_replace('/Repository$/', '', static::class);

        // Change the namespace from "Repository" to "Model"
        $modelClassName = str_replace('\\Repository\\', '\\Model\\', $modelClassName);

        if (!class_exists($modelClassName)) {
            throw new \Exception(
                "No class $modelClassName could be found. If your Model and/or Repository don't follow the " .
                "expected naming convention, your repository must implement its own version of getModelClass()"
            );
        }

        return $modelClassName;
    }

    /**
     * @throws \Exception
     * @param int[] $ids
     * @return ElasticSearchTypeCollection
     */
    public function getById(array $ids) : ElasticSearchTypeCollection
    {
        $response = $this->searchService->getResults($this->getQueryBuilder()->whereIn('id', $ids));
        return $this->resultsToTypeCollection($response);
    }

    /**
     * Retrieves a page of model objects that fit the passed filter.
     *
     * @throws \Exception
     * @param Filter $filter
     * @param int $pageNumber 1-based page number
     * @return ElasticSearchTypeCollection
     */
    public function getFilteredPage(Filter $filter, $pageNumber) : ElasticSearchTypeCollection
    {
        $qb = $this->getQueryBuilder();
        $qb->paginate($pageNumber, self::DEFAULT_PAGE_SIZE);

        $filteredIds = $this->getIdsThatMayBeAddedToFilter($filter);

        // We exclude any IDs from the result that are already in the filter, because otherwise the returned
        // page would include items the user has already selected and added to the filter.
        $idsToExclude = $filter->getIdsByType($this->getModelClass());

        // We can only call byId() or excludeIds() - the two are mutually incompatible calls (TODO: maybe fix that)
        if (empty($filteredIds)) {
            $qb->excludeIds($idsToExclude);
        } else {
            $filteredIds = array_diff($filteredIds, $idsToExclude);

            // If the result of removing $idsToExclude from the legal filter options is that
            // no filter options remain, return an empty collection instead of running an ES query
            if (empty($filteredIds)) {
                return new ElasticSearchTypeCollection();
            }

            $qb->byId($filteredIds);
        }

        $response = $this->searchService->getResults($qb);
        return $this->resultsToTypeCollection($response);
    }

    /**
     * Retrieves a page of model objects that are related to the passed set of transactions.
     *
     * @throws \Exception
     * @param array $transactionIds
     * @param int $pageNumber
     * @return ElasticSearchTypeCollection
     */
    public function getPageByTransactionIds(array $transactionIds, int $pageNumber) : ElasticSearchTypeCollection
    {
        $qb = $this->getQueryBuilder();
        $qb->paginate($pageNumber, self::DEFAULT_PAGE_SIZE);
        $qb->whereIn('transaction_ids', $transactionIds);
        $qb->filterReturned('transaction_ids', $transactionIds);

        $results = $this->searchService->getResults($qb);
        return $this->resultsToTypeCollection($results);
    }

    /**
     * Retrieves a page of model objects that fit the passed query string
     *
     * @throws \Exception
     * @param string $searchQuery
     * @param int $pageNumber 1-based page number
     * @return ElasticSearchTypeCollection
     */
    public function getPageByTextSearch($searchQuery, $pageNumber) : ElasticSearchTypeCollection
    {
        $qb = $this->getQueryBuilder()
            ->paginate($pageNumber, self::DEFAULT_PAGE_SIZE)
            ->byText($searchQuery);

        $response = $this->searchService->getResults($qb);
        return $this->resultsToTypeCollection($response);
    }

    /**
     * Retrieve the IDs of all instances that could be added to the passed filter without resulting in an empty result.
     * It is important to note that each repository must ignore filters of its own type. That is to say, if an
     * Institution is selected, that should not prohibit the addition of further Institutions to the Filter - only
     * adding Filter items of other types should impact the options of a given type.
     *
     * @throws \Exception
     * @param Filter $filter
     * @return array
     */
    protected function getIdsThatMayBeAddedToFilter(Filter $filter) : array
    {
        // Clone the filter before making any changes so that the caller's filter doesn't get changed
        $filter = clone $filter;

        // Remove filters of own type if applicable - you can't restrict Users by picking a User
        if ($this->isFilterRepository()) {
            $filter->setIdsByType($this->getModelClass(), []);
        }

        $transactionIds = $this->repositoryManager->getTransactionRepository()->getIdsByFilter($filter);
        $ownIds = $this->getIdsByTransactionIds($transactionIds);

        return $ownIds;
    }

    /**
     * Returns true for repositories that store objects that can be a part of a filter. Override for repositories that
     * cannot be included in the filter to avoid triggering behavior that is specific to filter repositories.
     *
     * @return bool
     */
    protected function isFilterRepository() : bool
    {
        return true;
    }

    /**
     * Gets IDs of this type that are associated with a set of transaction IDs
     *
     * TODO: Figure out how to make the query here unique by the required field so that we don't have to process a
     * large number of redundant results.
     *
     * @throws \Exception
     * @param array $transactionIds
     * @return int[]
     */
    protected function getIdsByTransactionIds(array $transactionIds)
    {
        // TODO: Don't do this any more! We are limiting the number of transaction IDs that we request to 1000 because
        // the server limits out at 1024 clauses (we leave 24 in case other clauses are in the query)
        $maxTransactionCount = 1000;
        if (count($transactionIds) > $maxTransactionCount) {
            $transactionIds = array_slice($transactionIds, 0, $maxTransactionCount);
        }

        $transactionQb = $this->searchService->getQueryBuilder(ElasticSearchQueryBuilder::TYPE_TRANSACTION)->byId($transactionIds);
        $transactionResults = $this->searchService->getResults($transactionQb);

        if (empty($transactionResults)) {
            // This should be impossible, since we presumably are always passing transaction IDs that we already received via another query
            throw new \Exception('No transactions were found with the following IDs: ' . implode(', ', $transactionIds));
        }

        $ownIds = $this->getOwnIdsFromTransactionResults($transactionResults);

        if (empty($ownIds)) {
            // This shouldn't happen because no records should exist in the database without a relationship to at least one transaction
//            throw new \Exception('No records from the ' . static::class . ' repository could be found for the following transactions: ' . implode(', ', $transactionIds));
        }

        $ownIds = array_values(array_unique($ownIds)); // array_unique is only necessary because the query builder doesn't support unique queries yet. array_values() is to give the resulting array nice indices
        return $ownIds;
    }

    /**
     * Given a set of IDs of the repository's own type, retrieves the IDs of all transactions associated with all of
     * the records with those IDs.
     *
     * @param int[] $ownIds
     * @return int[]
     */
    public function getTransactionIdsByOwnIds(array $ownIds) : array
    {
        // TODO: We should be able to craft a query such that it returns the unique set of transaction IDs instead of doing that work in PHP
        $qb = $this->getQueryBuilder()->whereIn('id', $ownIds);
        $results = $this->searchService->getResults($qb);

        $transactionIds = [];
        foreach ($results as $result) {
            // This array_replace() allows us to guarantee uniqueness using the val => val trick without having to call
            // array_unique on a growing array for each loop
            $newTransactionIds = $result['_source']['transaction_ids'];
            $transactionIds = array_replace($transactionIds, array_combine($newTransactionIds, $newTransactionIds));
        }

        return array_values($transactionIds); // array_values() so that
    }

    /**
     * @param array $transactionResults An array returned by SearchService when given a query for TYPE_TRANSACTION
     * @return int[] Array containing all IDs of this Repository's type that correspond to the returned transaction
     * records
     */
    abstract protected function getOwnIdsFromTransactionResults(array $transactionResults) : array;

    /**
     * @throws \Exception
     * @param array $results
     * @return ElasticSearchTypeCollection
     */
    protected function resultsToTypeCollection(array $results) : ElasticSearchTypeCollection
    {
        $instances = new ElasticSearchTypeCollection();
        foreach ($results as $curHit) {
            $modelClass = $this->getModelClass();
            $instance = new $modelClass(
                $curHit['_id'],
                static::getNameFromSearchResult($curHit),
                count($curHit['_source']['transaction_ids'])
            );
            $instances->add($instance);
        }

        return $instances;
    }

    /**
     * Gets a query builder that, when submitted to the SearchService, will return all records of the type this
     * repository is responsible for. Further filters can then be added by calling additional methods on the query
     * builder.
     *
     * @return \PacificaSearchBundle\Service\ElasticSearchQueryBuilder
     */
    protected function getQueryBuilder() : ElasticSearchQueryBuilder
    {
        return $this->searchService->getQueryBuilder($this->getType());
    }

    /**
     * Gets the type (one of the ElasticSearchQueryBuilder::TYPE_* constants) that this repository is responsible for
     */
    abstract protected function getType() : string;

    /**
     * Given a single result (an entry from the "hits" field of an Elastic Search results object), returns a string
     * representing the display name of the result. The most common case is implemented here - for other cases, override
     * this function.
     *
     * @param array $result
     * @return string
     */
    protected static function getNameFromSearchResult(array $result) : string
    {
        return $result['_source']['display_name'];
    }
}
