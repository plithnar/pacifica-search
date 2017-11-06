<?php

namespace PacificaSearchBundle\Controller;

use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Repository\InstrumentRepository;
use PacificaSearchBundle\Repository\InstrumentTypeRepository;
use PacificaSearchBundle\Repository\InstitutionRepository;
use PacificaSearchBundle\Repository\ProposalRepository;
use PacificaSearchBundle\Repository\Repository;
use PacificaSearchBundle\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class SearchController extends Controller
{
    public function indexAction()
    {
        /** @var ElasticSearchTypeCollection[] */
        $filters = array_map(function ($repoClass) {
            /** @var Repository $repo */
            $repo = $this->container->get($repoClass);
            $instances = $repo->getAll()->sortByDisplayName();

            // If a repo returns an empty set then something has gone wrong
            if (!count($instances)) {
                throw new \RuntimeException(
                    "No records found in $repoClass::getAll(), this is probably an error in your Elastic Search "
                  . "configuration or the corresponding type in your Elastic Search database is not populated"
                );
            }

            return $instances;
        }, [
            InstrumentTypeRepository::class,
            InstrumentRepository::class,
            InstitutionRepository::class,
            UserRepository::class,
            ProposalRepository::class
        ]);

        return $this->render(
            'PacificaSearchBundle::search.html.twig',
            [
                'filters' => $filters
            ]
        );
    }
}
