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
                'filters' => $filters
            ]
        );
    }

    public function testAction()
    {
        /** @var InstitutionRepository $r */
        $r = $this->container->get(InstitutionRepository::class);
        $res = $r->getById(43256);

        echo "<pre><code>";
        print_r($res);
        echo "</pre></code>";
        die();
    }
}
