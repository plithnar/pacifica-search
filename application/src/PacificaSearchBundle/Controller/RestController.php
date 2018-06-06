<?php

namespace PacificaSearchBundle\Controller;

use FOS\RestBundle\View\View;
use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\Institution;
use PacificaSearchBundle\Model\Instrument;
use PacificaSearchBundle\Model\InstrumentType;
use PacificaSearchBundle\Model\Proposal;
use PacificaSearchBundle\Model\User;
use PacificaSearchBundle\Repository\Repository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * @codeCoverageIgnore - Because this controller relies on functionality provided by the FOSRestController there is
 * no practical way for us to convert it to use dependency injection and so it cannot be unit tested.
 */
class RestController extends BaseRestController
{
    /**
     * Retrieves a page for each filter type based a text search
     *
     * @throws \Exception
     * @param Request $request
     * @return Response
     */
    public function getText_searchAction(Request $request)
    {
        $searchQuery = $request->query->get('search_query');
        if (null === $searchQuery) {
            throw new \Exception("Missing mandatory query parameter 'search_query'");
        }

        $transactionIds = $this->transactionRepository->getIdsByTextSearch($searchQuery);

        $filterPages = [];
        foreach ($this->getFilterableRepositories() as $type => $repository) {
            $filterPages[$type] = $repository->getPageByTransactionIds($transactionIds, 1);
        }
    }

    /**
     * Retrieves a page of allowable filter items based on which items are already selected in the other filter types
     *
     * @throws \Exception
     * @param string $type
     * @param int $pageNumber
     * @param Request $request
     * @return Response
     */
    public function postFilterPageAction($type, $pageNumber, Request $request) : Response
    {
        if ($pageNumber < 1 || intval($pageNumber) != $pageNumber) {
            return $this->handleView(View::create([]));
        }

        $filterableRepositories = $this->getFilterableRepositories();
        if (!array_key_exists($type, $filterableRepositories)) {
            throw new \Exception("'$type' is not a valid type. Valid options are: " . implode(', ', array_keys($filterableRepositories)));
        }

        $this->setPageByType($type, $pageNumber);

        $repository = $filterableRepositories[$type];
        $filter = Filter::fromRequest($request);
        $filteredPageContents = $repository->getFilteredPage($filter, $pageNumber);

        return $this->handleView(View::create($filteredPageContents));
    }

    /**
     * Retrieves a page for each filter type based on the current contents of the filter
     * @throws \Exception
     * @param Request $request
     * @return Response
     */
    public function postFilterPagesAction(Request $request) : Response
    {
        $filter = Filter::fromRequest($request);
        $transactionIdsByFilterItem = $this->transactionRepository->getIdsByFilterItem($filter);

        $filterPages = [];
        foreach ($this->getFilterableRepositories() as $type => $repository) {
            $transIds = $transactionIdsByFilterItem;
            unset($transIds[$type]);
            $transIds = array_values($transIds);

            $filteredTransactionIds = array_of_arrays_intersect($transIds);

            $filterPages[$type] = $repository->getPageByTransactionIds(
                $filteredTransactionIds,
                $this->getPageNumberByType($type)
            );
        }

        $allTransactionIds = array_of_arrays_union($transactionIdsByFilterItem);

        return $this->handleView(View::create([
            'transaction_count' => count($allTransactionIds),
            'filter_pages' => $filterPages
        ]));
    }

    private function getPageNumberByType($type)
    {
        $pagesByType = $this->getPageNumbersByType();
        return $pagesByType[$type];
    }
    private function getPageNumbersByType()
    {
        $pagesByType = $this->getSession()->get('pages_by_type');
        if (null === $pagesByType) {
            $pagesByType = [
                Institution::getMachineName() => 1,
                Instrument::getMachineName() => 1,
                InstrumentType::getMachineName() => 1,
                Proposal::getMachineName() => 1,
                User::getMachineName() => 1
            ];
            $this->getSession()->set('pages_by_type', $pagesByType);
        }
        return $pagesByType;
    }
    private function setPageByType($type, $page)
    {
        $pagesByType = $this->getPageNumbersByType();
        $pagesByType[$type] = $page;
    }

    /**
     * @throws \InvalidArgumentException
     * @param $type
     * @return Repository
     */
    protected function getRepositoryByType($type) : Repository
    {
        $repositoriesByType = [
            Institution::getMachineName() => $this->institutionRepository,
            Instrument::getMachineName() => $this->instrumentRepository,
            InstrumentType::getMachineName() => $this->instrumentTypeRepository,
            Proposal::getMachineName() => $this->proposalRepository,
            User::getMachineName() => $this->userRepository
        ];

        if (!array_key_exists($type, $repositoriesByType)) {
            throw new \InvalidArgumentException("Type $type is not a valid type. Valid types are " . implode(', ', array_keys($repositoriesByType)));
        }

        return $repositoriesByType[$type];
    }
}
