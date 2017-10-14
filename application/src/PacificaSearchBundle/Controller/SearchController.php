<?php

namespace PacificaSearchBundle\Controller;

use PacificaSearchBundle\Repository\FilterResultsRepository;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class SearchController extends Controller
{
    public function indexAction()
    {
        $resultsRepo = $this->container->get(FilterResultsRepository::class);
        $filter = null; // TODO:
        $filterResults = $resultsRepo->getResults($filter);
        $sectionLabels = [
            'instrument_types' => 'Instrument Type',
            'instruments' => 'Instrument',
            'institutions' => 'Institution',
            'users' => 'User',
            'proposals' => 'Proposal'
        ];

        return $this->render(
            'PacificaSearchBundle::search.html.twig',
            [
                'filterResults' => $filterResults,
                'sectionLabels' => $sectionLabels
            ]
        );
    }
}
