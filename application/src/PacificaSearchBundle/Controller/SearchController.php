<?php

namespace PacificaSearchBundle\Controller;

use PacificaSearchBundle\Exception\NoRecordsFoundException;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Repository\InstitutionRepository;
use PacificaSearchBundle\Repository\InstrumentRepository;
use PacificaSearchBundle\Repository\InstrumentTypeRepository;
use PacificaSearchBundle\Repository\ProposalRepository;
use PacificaSearchBundle\Repository\Repository;
use PacificaSearchBundle\Repository\TransactionRepository;
use PacificaSearchBundle\Repository\UserRepository;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Templating\EngineInterface;

class SearchController
{
    use FilterAwareController;

    /** @var TransactionRepository */
    protected $transactionRepository;

    /** @var EngineInterface */
    protected $renderingEngine;

    public function __construct(
        InstitutionRepository $institutionRepository,
        InstrumentRepository $instrumentRepository,
        InstrumentTypeRepository $instrumentTypeRepository,
        ProposalRepository $proposalRepository,
        UserRepository $userRepository,
        TransactionRepository $transactionRepository,
        EngineInterface $renderingEngine
    ) {
        $this->initFilterableRepositories(
            $institutionRepository,
            $instrumentRepository,
            $instrumentTypeRepository,
            $proposalRepository,
            $userRepository
        );

        $this->transactionRepository = $transactionRepository;
        $this->renderingEngine = $renderingEngine;
    }

    /**
     * Renders the GUI of the Pacifica Search application
     * @return Response
     */
    public function indexAction() : Response
    {
        /** @var ElasticSearchTypeCollection[] $filters */
        $filters = array_map(function (Repository $repository) {
            $ids = $this->transactionRepository->getIdsOfTypeAssociatedWithAtLeastOneTransaction($repository->getModelClass());
            $instances = $repository->getById($ids);

            // If a repo returns an empty set then something has gone wrong
            if (!count($instances)) {
                $repositoryClass = get_class($repository);
                throw new NoRecordsFoundException(
                    "No records found for $repositoryClass, this is probably an error in your Elastic Search "
                    . "configuration or the corresponding type in your Elastic Search database is not populated"
                );
            }

            return $instances;
        }, $this->getFilterableRepositories());

        $renderedContent = $this->renderingEngine->render(
            'PacificaSearchBundle::search.html.twig',
            [
                'filters' => $filters
            ]
        );

        return new Response($renderedContent);
    }

    /**
     * Gets all Repository classes that implement the FilterRepository base class, which is the same as the set of
     * Repositories that contain items that can be filtered on in the GUI.
     *
     * @return Repository[]
     */
    protected function getFilterableRepositories() : array
    {
        return [
            $this->institutionRepository,
            $this->instrumentRepository,
            $this->instrumentTypeRepository,
            $this->proposalRepository,
            $this->userRepository
        ];
    }
}
