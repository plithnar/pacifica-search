<?php

namespace PacificaSearchBundle\Controller;

use FOS\RestBundle\Controller\FOSRestController;
use FOS\RestBundle\View\View;
use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Repository\Repository;

class RestController extends FOSRestController
{
    /**
     * Retrieves the ids of filter options that are valid given the current state of the filter.
     * The returned object is formatted like:
     *
     * {
     *   "instrument_types" : [ "12", "15", "23" ],
     *   "instruments" : [...],
     *   "institutions" : [...],
     *   "users" : [...],
     *   "proposals" : [...]
     * }
     *
     * The IDs indicate those filter options that can be added to the current filter without resulting in a filter
     * that returns no results at all.
     */
    public function getValid_filter_idsAction()
    {
        $filter = new Filter();

        /** @var $filterIds ElasticSearchTypeCollection[] */
        $filterIds = [];

        foreach (Repository::getImplementingClassNames() as $repoClass) {
            /** @var Repository $repo */
            $repo = $this->container->get($repoClass);
            $filterIds[$repo::getModelClass()::getMachineName()] = $repo->getFilteredIds($filter);
        }

        return $this->handleView(View::create($filterIds));
    }

    /**
     * Sets the current filter
     *
     * The filter is made up of collections of IDs, formatted like:
     * {
     *   "instrument_types" : ["12", "22", "23"],
     *   "instruments" : ["1", "3"],
     *   "institutions" : [],
     *   "users" : ["5"],
     *   "proposals" : []
     * }
     */
    public function putFilterAction()
    {
        return $this->handleView(View::create([ 'result' => 'Ok']));
    }

    /**
     * Retrieves the current state of the filter. The form of the returned object is the same as the
     * object expected by putFilterAction()
     */
    public function getFilterAction()
    {
        return $this->handleView(View::create([]));
    }
}
