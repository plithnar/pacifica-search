<?php

namespace PacificaSearchBundle\Controller;

use PacificaSearchBundle\Repository\InstrumentTypeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class SearchController extends Controller
{
    public function indexAction()
    {
        /** @var InstrumentTypeRepository $instrumentTypeRepo */
        $instrumentTypeRepo = $this->container->get(InstrumentTypeRepository::class);
        $instrumentTypes = $instrumentTypeRepo->getAllInstrumentTypes();

        return $this->render(
            'PacificaSearchBundle::search.html.twig',
            [
                'filters' => [
                    $instrumentTypes
                ]
            ]
        );
    }
}
