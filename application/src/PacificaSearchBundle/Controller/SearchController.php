<?php

namespace PacificaSearchBundle\Controller;

use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Repository\FileRepository;
use PacificaSearchBundle\Repository\FilterRepository;
use PacificaSearchBundle\Repository\InstitutionRepository;
use PacificaSearchBundle\Repository\Repository;
use PacificaSearchBundle\Repository\TransactionRepository;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class SearchController extends Controller
{
    private $page_data = [];
    public function __construct()
    {
        $this->page_data['script_uris'] = array(
            'js/lib/spinner/spin.min.js',
            'js/lib/fancytree/dist/jquery.fancytree-all.js',
            'js/lib/select2/dist/js/select2.js'
        );
        $this->page_data['css_uris'] = array(
            'js/lib/fancytree/dist/skin-lion/ui.fancytree.min.css',
            'js/lib/select2/dist/css/select2.css',
            'css/file_directory_styling.css',
            'css/combined.css'
        );
    }
    public function indexAction()
    {
        /** @var ElasticSearchTypeCollection[] */
        $filters = array_map(function ($repoClass) {
            /** @var FilterRepository $repo */
            $repo = $this->container->get($repoClass);

            // TODO: Either refactor this for readability/prettiness or remove it, depending on whether we find out
            // that there are no orphaned records in the production database.
            $ids = $this->container->get(TransactionRepository::class)->getIdsOfTypeAssociatedWithAtLeastOneTransaction($repoClass::getModelClass());
            $instances = $repo->getById($ids);

            // If a repo returns an empty set then something has gone wrong
            if (!count($instances)) {
                throw new \RuntimeException(
                    "No records found for $repoClass, this is probably an error in your Elastic Search "
                    . "configuration or the corresponding type in your Elastic Search database is not populated"
                );
            }

            return $instances;
        }, FilterRepository::getImplementingClassNames());

        return $this->render(
            'PacificaSearchBundle::search.html.twig',
            [
                'filters' => $filters,
                'page_data' => $this->page_data
            ]
        );
    }
}
