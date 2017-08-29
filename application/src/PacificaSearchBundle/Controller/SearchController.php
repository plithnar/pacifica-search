<?php

namespace PacificaSearchBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class SearchController extends Controller
{
    public function indexAction()
    {
        return $this->render('PacificaSearchBundle::search.html.twig');
    }
}
