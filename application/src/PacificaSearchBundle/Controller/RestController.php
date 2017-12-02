<?php

namespace PacificaSearchBundle\Controller;

use FOS\RestBundle\Controller\FOSRestController;
use FOS\RestBundle\View\View;
use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Repository\FileRepository;
use PacificaSearchBundle\Repository\FilterRepository;
use PacificaSearchBundle\Repository\Repository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;

// Annotations - IDE marks "unused" but they are not
use FOS\RestBundle\Controller\Annotations\Get;

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
     *
     * @Get("/valid_filter_ids")
     *
     * @return Response
     */
    public function getValidFilterIdsAction()
    {
        $filter = $this->getSession()->get('filter');

        /** @var $filterIds ElasticSearchTypeCollection[] */
        $filterIds = [];

        foreach (FilterRepository::getImplementingClassNames() as $repoClass) {
            /** @var Repository $repo */
            $repo = $this->container->get($repoClass);
            $filteredIds = $repo->getFilteredIds($filter);

            // NULL represents a case where no filtering was performed - we exclude these from the results, meaning
            // that all items of that type are still valid options
            if (null !== $filteredIds) {
                $filterIdsphp[$repo::getModelClass()::getMachineName()] = $filteredIds;
            }
        }

        return $this->handleView(View::create($filterIds));
    }

    /**
     * Retrieves files that fit the current filter
     *
     * @return Response
     */
    public function getFilesAction()
    {
        /** @var Filter $filter */
        $filter = $this->getSession()->get('filter');

        /** @var FileRepository $repo */
        $repo = $this->container->get(FileRepository::class);
        $fileIds = $repo->getFilteredIds($filter);
        $files = $repo->getById($fileIds);

        $response = [];
        foreach ($files->getInstances() as $file) {
            $response[] = $file->toArray();
        }

        return $this->handleView(View::create($response));
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
     * @return Session
     */
    private function getSession()
    {
        return $this->container->get('session');
    }
}
