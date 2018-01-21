<?php

namespace PacificaSearchBundle\Controller;

use FOS\RestBundle\View\View;
use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Repository\FileRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

// Annotations - IDE marks "unused" but they are not
use FOS\RestBundle\Controller\Annotations\Get;

/**
 * @codeCoverageIgnore - Because this controller relies on functionality provided by the FOSRestController there is
 * no practical way for us to convert it to use dependency injection and so it cannot be unit tested.
 */
class RestController extends BaseRestController
{
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
     * Retrieves a page of allowable filter items based on which items are already selected in the other filter types
     *
     * @throws \Exception
     * @param string $type
     * @param int $pageNumber
     * @return Response
     */
    public function getFilterPageAction($type, $pageNumber) : Response
    {
        if ($pageNumber < 1 || intval($pageNumber) != $pageNumber) {
            return $this->handleView(View::create([]));
        }

        /** @var Filter $filter */
        // TODO: Instead of storing the filter in the session, pass it as a request variable
        $filter = $this->getSession()->get('filter');

        $filterableRepositories = $this->getFilterableRepositories();
        if (!array_key_exists($type, $filterableRepositories)) {
            throw new \Exception("'$type' is not a valid type. Valid options are: " . implode(', ', array_keys($filterableRepositories)));
        }

        $repository = $filterableRepositories[$type];
        $filteredPageContents = $repository->getFilteredPage($filter, $pageNumber);

        return $this->handleView(View::create($filteredPageContents));
    }
}
