<?php

namespace PacificaSearchBundle\Repository;
use PacificaSearchBundle\Model\ConventionalElasticSearchType;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
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

    public function __construct(SearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    /**
     * Gets a query builder that, when submitted to the SearchService, will return all records of the type this
     * repository is responsible for.
     *
     * @return \PacificaSearchBundle\Service\ElasticSearchQueryBuilder
     */
    protected function getQueryBuilderForAllRecords()
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
     * Gets the name of the model class of the type that this repository is responsible for. Will attempt to find the
     * class by the convention that repository classes are named <ModelClass>Repository, override this method if that's
     * not the case.
     */
    protected static function getModelClass()
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
        $response = $this->searchService->getResults($this->getQueryBuilderForAllRecords());

        $instances = new ElasticSearchTypeCollection();
        foreach ($response['hits']['hits'] as $curHit) {
            $modelClass = static::getModelClass();
            $instance = new $modelClass($curHit['_id'], static::getNameFromSearchResult($curHit));
            $instances->add($instance);
        }

        return $instances;
    }

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