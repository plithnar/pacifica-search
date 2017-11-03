<?php

namespace PacificaSearchBundle\Repository;

require_once(__DIR__ . '/../../../vendor/autoload.php');

use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;
use PacificaSearchBundle\Model\InstrumentType;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;
use PacificaSearchBundle\Service\SearchService;

class InstrumentTypeRepository extends Repository
{
    /** @var SearchService */
    protected $searchService;

    public function __construct(SearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    /**
     * @param Filter|null $filter
     * @return ElasticSearchTypeCollection
     */
    public function getAll(Filter $filter = null)
    {
        $qb = $this->searchService
            ->getQueryBuilder(ElasticSearchQueryBuilder::TYPE_GROUP)
            ->whereNestedFieldExists('instrument_members.instrument_id');

        $response = $this->searchService->getResults($qb);

        $instrumentTypes = new ElasticSearchTypeCollection();
        foreach ($response['hits']['hits'] as $curHit) {
            $instrumentType = new InstrumentType($curHit['_id'], $curHit['_source']['name']);
            $instrumentTypes->add($instrumentType);
        }

        return $instrumentTypes;
    }
}