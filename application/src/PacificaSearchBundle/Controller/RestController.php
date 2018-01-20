<?php

namespace PacificaSearchBundle\Controller;

use FOS\RestBundle\Controller\FOSRestController;
use FOS\RestBundle\View\View;
use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Repository\FileRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;
use PacificaSearchBundle\Repository\InstitutionRepository;
use PacificaSearchBundle\Repository\InstrumentRepository;
use PacificaSearchBundle\Repository\InstrumentTypeRepository;
use PacificaSearchBundle\Repository\ProposalRepository;
use PacificaSearchBundle\Repository\UserRepository;

// Annotations - IDE marks "unused" but they are not
use FOS\RestBundle\Controller\Annotations\Get;

/**
 * @codeCoverageIgnore - Because this controller relies on functionality provided by the FOSRestController there is
 * no practical way for us to convert it to use dependency injection and so it cannot be unit tested.
 */
class RestController extends FOSRestController
{
    use FilterAwareController;

    public function __construct(
        InstitutionRepository $institutionRepository,
        InstrumentRepository $instrumentRepository,
        InstrumentTypeRepository $instrumentTypeRepository,
        ProposalRepository $proposalRepository,
        UserRepository $userRepository
    ) {
        $this->initFilterableRepositories(
            $institutionRepository,
            $instrumentRepository,
            $instrumentTypeRepository,
            $proposalRepository,
            $userRepository
        );
    }

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
        // TODO: Instead of storing the filter in the session, pass it as a request variable
        $filter = $this->getSession()->get('filter');
        dump($filter);
        /** @var $filterIds ElasticSearchTypeCollection[] */
        $filterIds = [];

        foreach ($this->getFilterableRepositories() as $repo) {
            $filteredIds = $repo->getFilteredIds($filter);

            // NULL represents a case where no filtering was performed - we exclude these from the results, meaning
            // that all items of that type are still valid options
            if (null !== $filteredIds) {
                $filterIds[$repo->getModelClass()::getMachineName()] = $filteredIds;
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
        // TODO: Instead of storing the filter in the session, pass it as a request variable
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
     * Retrieves transactions that fit the current filter
     *
     * @return Response
     */
    public function getTransactionsAction()
    {
        /** @var Filter $filter */
        $filter = $this->getSession()->get('filter');

        /** @var FileRepository $repo */
        $repo = $this->container->get(TransactionRepository::class);
        $transactionIds = $repo->getFilteredTransactions($filter);
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
     * Retrieves a page of allowable filter items based on which items are already selected in the other filter types
     *
     * Parameters:
     * The body of the request defines the values to be filtered on in a hash of IDs formatted like
     * {
     *   "instrument_types" : ["12", "22", "23"],
     *   "instruments" : ["1", "3"],
     *   "institutions" : [],
     *   "users" : ["5"],
     *   "proposals" : []
     * }
     *
     * Additional GET parameters:
     * type - The machine name of a Model class
     * page - The page to retrieve
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

    /**
     * @return Session
     */
    private function getSession()
    {
        return $this->container->get('session');
    }
}
