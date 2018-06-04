<?php

namespace PacificaSearchBundle\Service;

interface SearchServiceInterface
{
    /**
     * Factory method that creates a new instance of ElasticSearchQueryBuilder
     * @param string $type One of the ElasticSearchQueryBuilder::TYPE_* constants
     * @return ElasticSearchQueryBuilder
     */
    public function getQueryBuilder($type);

    /**
     * @param ElasticSearchQueryBuilder $queryBuilder
     * @return array The results of the search
     */
    public function getResults(ElasticSearchQueryBuilder $queryBuilder);

    /**
     * Retrieve only the IDs of the fields matched by a query
     * @param ElasticSearchQueryBuilder $queryBuilder
     * @return int[]
     */
    public function getIds(ElasticSearchQueryBuilder $queryBuilder);
}
