<?php

namespace PacificaSearchBundle\Controller;

use FOS\RestBundle\Controller\FOSRestController;
use FOS\RestBundle\View\View;

class RestController extends FOSRestController
{
    /**
     * Retrieves the results of the current filter.
     *
     * TODO: Document format
     */
    public function getResultsAction()
    {
        return $this->handleView(View::create(["a" => 1, 2, 3]));
    }

    /**
     * Sets the current filter
     *
     * TODO: Document format
     */
    public function putFilterAction()
    {
        return $this->handleView(View::create([ 'result' => 'Ok']));
    }

    /**
     * Retrieves the current state of the filter
     *
     * TODO: Document format
     */
    public function getFilterAction()
    {
        return $this->handleView(View::create([]));
    }
}
