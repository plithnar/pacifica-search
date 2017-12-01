<?php

namespace PacificaSearchBundle\Repository;
use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;
use PacificaSearchBundle\Service\RepositoryManager;
use PacificaSearchBundle\Service\SearchService;

/**
 * Class Repository
 *
 * Base class for Pacifica Search repositories
 */
abstract class Repository
{
    /** @var SearchService */
    protected $searchService;

    /** @var RepositoryManager */
    protected $repositoryManager;

    public function __construct(SearchService $searchService, RepositoryManager $repositoryManager)
    {
        $this->searchService = $searchService;
        $this->repositoryManager = $repositoryManager;
    }

    /**
     * Retrieve the IDs of all instances that could be added to the passed filter without resulting in an empty result.
     * It is important to note that each repository must ignore filters of its own type. That is to say, if an
     * Institution is selected, that should not prohibit the addition of further Institutions to the Filter - only
     * adding Filter items of other types should impact the options of a given type.
     *
     * @param Filter $filter
     * @return array|NULL NULL indicates that no filtering was performed because the filter was empty (possibly after
     *   removing all of the Repository's own model class's items)
     */
    public function getFilteredIds(Filter $filter)
    {
        // Clone the filter before making any changes so that the caller's filter doesn't get changed
        $filter = clone $filter;

        // Remove filters of own type if applicable - you can't restrict Users by picking a User
        if ($this instanceof FilterRepository) {
            $filter->setIdsByType(self::getModelClass(), []);
        }

        // We don't do any filtering if the filter contains no values
        if ($filter->isEmpty()) {
            return NULL;
        }

        $transactionIds = $this->repositoryManager->getTransactionRepository()->getIdsByFilter($filter);
        $ownIds = $this->getIdsByTransactionIds($transactionIds);

        return $ownIds;
    }

    /**
     * Gets IDs of this type that are associated with a set of transaction IDs
     *
     * TODO: Figure out how to make the query here unique by the required field so that we don't have to process a
     * large number of redundant results.
     *
     * @param array $transactionIds
     * @return int[]
     */
    protected function getIdsByTransactionIds(array $transactionIds)
    {
        $qb = $this->searchService->getQueryBuilder(ElasticSearchQueryBuilder::TYPE_TRANSACTION)->byId($transactionIds);
        $results = $this->searchService->getResults($qb);
        $ids = $this->getOwnIdsFromTransactionResults($results);
        $ids = array_values(array_unique($ids)); // array_unique is only necessary because the query builder doesn't support unique queries yet. array_values() is to give the resulting array nice indices
        return $ids;
    }

    /**
     * @param array $transactionResults An array returned by SearchService when given a query for TYPE_TRANSACTION
     * @return int[] Array containing all IDs of this Repository's type that correspond to the returned transaction
     * records
     */
    abstract protected function getOwnIdsFromTransactionResults(array $transactionResults);

    /**
     * Gets the name of the model class of the type that this repository is responsible for. Will attempt to find the
     * class by the convention that repository classes are named <ModelClass>Repository, override this method if that's
     * not the case.
     */
    public static function getModelClass()
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
     * Implements the most common form of getAll(), which presumes that our Type is a ConventionalElasticSearchType
     * and that our ElasticSearch objects contain ID and name fields in the expected places - if any of this is not
     * true then you should implement your own version of getAll()
     *
     * @return ElasticSearchTypeCollection
     */
    public function getAll()
    {
        $response = $this->searchService->getResults($this->getQueryBuilder());
        return $this->resultsToTypeCollection($response);
    }

    public function getById($ids)
    {
        if (!is_array($ids)){
            $ids = [$ids];
        }

        $response = $this->searchService->getResults($this->getQueryBuilder()->whereIn('id', $ids));
        return $this->resultsToTypeCollection($response);
    }

    private function resultsToTypeCollection(array $results)
    {
        $instances = new ElasticSearchTypeCollection();
        foreach ($results as $curHit) {
            $modelClass = static::getModelClass();
            $instance = new $modelClass($curHit['_id'], static::getNameFromSearchResult($curHit));
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
    protected function getQueryBuilder()
    {
        return $this->searchService
            ->getQueryBuilder($this->getType());
    }

    /**
     * Gets the type (one of the ElasticSearchQueryBuilder::TYPE_* constants) that this repository is responsible for
     * @return string
     */
    abstract protected function getType();

    /**
     * Given a single result (an entry from the "hits" field of an Elastic Search results object), returns a string
     * representing the display name of the result. The most common case is implemented here - for other cases, override
     * this function.
     *
     * @param array $result
     * @return string
     */
    protected static function getNameFromSearchResult(array $result)
    {
        return $result['_source']['name'];
    }
}