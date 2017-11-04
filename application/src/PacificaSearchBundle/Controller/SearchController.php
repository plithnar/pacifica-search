<?php

namespace PacificaSearchBundle\Controller;

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
        $filters = array_map(function ($repoClass) {
            /** @var Repository $repo */
            $repo = $this->container->get($repoClass);
            return $repo->getAll();
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
