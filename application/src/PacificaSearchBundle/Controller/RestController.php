<?php

namespace PacificaSearchBundle\Controller;

use FOS\RestBundle\Controller\FOSRestController;
use FOS\RestBundle\View\View;
use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Repository\Repository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;

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
        $filter = $this->getSession()->get('filter');

        /** @var $filterIds ElasticSearchTypeCollection[] */
        $filterIds = [];

        foreach (Repository::getImplementingClassNames() as $repoClass) {
            /** @var Repository $repo */
            $repo = $this->container->get($repoClass);
            $filteredIds = $repo->getFilteredIds($filter);
            if (null !== $filteredIds) {
                $filterIds[$repo::getModelClass()::getMachineName()] = $filteredIds;
            }
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
     *
     * @param Request $request
     * @return Response
     */
    public function putFilterAction(Request $request)
    {
        $filterValues = json_decode($request->getContent(), true);

        $filter = Filter::fromArray($filterValues);
        $this->getSession()->set('filter', $filter);

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

    /**
     * @return Session
     */
    private function getSession()
    {
        return $this->container->get('session');
    }
}
