<?php

namespace PacificaSearchBundle\Repository;
use PacificaSearchBundle\Model\ElasticSearchTypeCollection;

/**
 * Class Repository
 *
 * Base class for Pacifica Search repositories
 */
abstract class Repository
{
    /**
     * Gets all records of the type managed by the repository
     * @return ElasticSearchTypeCollection
     */
    abstract public function getAll();
}