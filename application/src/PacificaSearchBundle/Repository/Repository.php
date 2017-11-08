<?php

namespace PacificaSearchBundle\Repository;
use PacificaSearchBundle\Filter;
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

    /**
     * We store names of implementing classes statically on the assumption that we aren't dynamically declaring new
     * Repository classes, because that would be insane.
     * @var string[]
     */
    private static $implementingClassNames;

    public function __construct(SearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    /**
     * Retrieve the IDs of all instances that could be added to the passed filter without resulting in an empty result.
     * It is important to note that each repository must ignore filters of its own type. That is to say, if an
     * Institution is selected, that should not prohibit the addition of further Institutions to the Filter - only
     * adding Filter items of other types should impact the options of a given type.
     *
     * @param Filter $filter
     * @return array
     */
    abstract public function getFilteredIds(Filter $filter);

    /**
     * Returns an array of the names of all classes that extend this class
     * @return string[]
     */
    public static function getImplementingClassNames()
    {
        if (self::$implementingClassNames === null) {
            // Make sure all of the classes have been declared - otherwise get_declared_classes() will only return the
            // classes that happen to have been autoloaded
            foreach (glob(__DIR__ . "/*.php") as $filename) {
                require_once($filename);
            }

            self::$implementingClassNames = [];
            foreach( get_declared_classes() as $class ) {
                if( is_subclass_of( $class, self::class ) ) {
                    self::$implementingClassNames[] = $class;
                }
            }
        }

        return self::$implementingClassNames;
    }

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