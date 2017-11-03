<?php

namespace PacificaSearchBundle\Service;


use Elasticsearch\Client;
use Elasticsearch\ClientBuilder;

class SearchService
{
    /** @var string */
    private $host;

    /** @var string */
    private $index;

    /** @var Client */
    private $client;

    /**
     * @param string $host
     * @param string $index
     */
    public function __construct($host, $index)
    {
        $this->host = $host;
        $this->index = $index;
    }

    /**
     * @return Client
     */
    public function getClient()
    {
        if (!$this->client) {
            $this->client = ClientBuilder::create()
                ->setHosts([$this->host])
                ->build();
        }

        return $this->client;
    }

    /**
     * Factory method that creates a new instance of ElasticSearchQueryBuilder
     * @param string $type One of the ElasticSearchQueryBuilder::TYPE_* constants
     * @return ElasticSearchQueryBuilder
     */
    public function getQueryBuilder($type)
    {
        $qb = new ElasticSearchQueryBuilder($this->index, $type);
        return $qb;
    }

    /**
     * @param ElasticSearchQueryBuilder $queryBuilder
     * @return array The results of the search
     */
    public function getResults(ElasticSearchQueryBuilder $queryBuilder)
    {
        $client = $this->getClient();
        $request = $queryBuilder->toArray();
        return $client->search($request);
    }
}