<?php

namespace PacificaSearchBundle\Controller;

use FOS\RestBundle\Controller\FOSRestController;
use FOS\RestBundle\View\View;
use PacificaSearchBundle\Repository\FilterResultsRepository;

class RestController extends FOSRestController
{
    /**
     * Retrieves the results of the current filter. The returned object is formatted like:
     *
     * {
     *   "instrument_types" : [
     *     {
     *       "id" : "12",
     *       "TODO..." : ...
     *     },
     *     ...
     *   ],
     *   "instruments" : [],
     *   "institutions" : [],
     *   "users" : [],
     *   "proposals" : []
     * }
     */
    public function getResultsAction()
    {
        /** @var FilterResultsRepository $resultsRepo */
        $resultsRepo = $this->container->get(FilterResultsRepository::class);
        $filter = null; // TODO
        return $this->handleView(View::create($resultsRepo->getResults($filter)));
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
