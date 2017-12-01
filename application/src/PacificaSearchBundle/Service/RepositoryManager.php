<?php

namespace PacificaSearchBundle\Service;

use PacificaSearchBundle\Repository\FileRepository;
use PacificaSearchBundle\Repository\InstitutionRepository;
use PacificaSearchBundle\Repository\InstrumentRepository;
use PacificaSearchBundle\Repository\InstrumentTypeRepository;
use PacificaSearchBundle\Repository\ProposalRepository;
use PacificaSearchBundle\Repository\TransactionRepository;
use PacificaSearchBundle\Repository\UserRepository;

/**
 * Class RepositoryManager
 *
 * We require a manager class that can be used to offer repositories access to one another because we have circular
 * relationships between some repositories that make simple dependency injection impossible
 */
class RepositoryManager
{
    /** @var SearchService */
    private $searchService;

    /** @var InstitutionRepository */
    private $institutionRepository;

    /** @var InstrumentRepository */
    private $instrumentRepository;

    /** @var InstrumentTypeRepository */
    private $instrumentTypeRepository;

    /** @var ProposalRepository */
    private $proposalRepository;

    /** @var UserRepository */
    private $userRepository;

    /** @var TransactionRepository */
    private $transactionRepository;

    /** @var FileRepository */
    private $fileRepository;

    public function __construct(SearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    /**
     * @return InstitutionRepository
     */
    public function getInstitutionRepository() : InstitutionRepository
    {
        if ($this->institutionRepository === NULL) {
            $this->institutionRepository = new InstitutionRepository($this->searchService, $this);
        }

        return $this->institutionRepository;
    }

    /**
     * @return InstrumentRepository
     */
    public function getInstrumentRepository() : InstrumentRepository
    {
        if ($this->instrumentRepository === NULL) {
            $this->instrumentRepository = new InstrumentRepository($this->searchService, $this);
        }

        return $this->instrumentRepository;
    }

    /**
     * @return InstrumentTypeRepository
     */
    public function getInstrumentTypeRepository() : InstrumentTypeRepository
    {
        if ($this->instrumentTypeRepository === NULL) {
            $this->instrumentTypeRepository = new InstrumentTypeRepository($this->searchService, $this);
        }

        return $this->instrumentTypeRepository;
    }

    /**
     * @return ProposalRepository
     */
    public function getProposalRepository() : ProposalRepository
    {
        if ($this->proposalRepository === NULL) {
            $this->proposalRepository = new ProposalRepository($this->searchService, $this);
        }

        return $this->proposalRepository;
    }

    /**
     * @return UserRepository
     */
    public function getUserRepository() : UserRepository
    {
        if ($this->userRepository === NULL) {
            $this->userRepository = new UserRepository($this->searchService, $this);
        }

        return $this->userRepository;
    }

    /**
     * @return TransactionRepository
     */
    public function getTransactionRepository() : TransactionRepository
    {
        if ($this->transactionRepository === NULL) {
            $this->transactionRepository = new TransactionRepository($this->searchService, $this);
        }

        return $this->transactionRepository;
    }

    /**
     * @return FileRepository
     */
    public function getFileRepository() : FileRepository
    {
        if ($this->fileRepository === NULL) {
            $this->fileRepository = new FileRepository($this->searchService, $this);
        }

        return $this->fileRepository;
    }
}