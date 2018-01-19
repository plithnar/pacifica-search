<?php

namespace PacificaSearchBundle\Controller;


use PacificaSearchBundle\Repository\InstitutionRepository;
use PacificaSearchBundle\Repository\InstrumentRepository;
use PacificaSearchBundle\Repository\InstrumentTypeRepository;
use PacificaSearchBundle\Repository\ProposalRepository;
use PacificaSearchBundle\Repository\Repository;
use PacificaSearchBundle\Repository\UserRepository;

trait FilterAwareController
{
    /** @var InstitutionRepository */
    protected $institutionRepository;

    /** @var InstrumentRepository */
    protected $instrumentRepository;

    /** @var InstrumentTypeRepository */
    protected $instrumentTypeRepository;

    /** @var ProposalRepository */
    protected $proposalRepository;

    /** @var UserRepository */
    protected $userRepository;

    protected function initFilterableRepositories(
        InstitutionRepository $institutionRepository,
        InstrumentRepository $instrumentRepository,
        InstrumentTypeRepository $instrumentTypeRepository,
        ProposalRepository $proposalRepository,
        UserRepository $userRepository
    ) {
        $this->institutionRepository = $institutionRepository;
        $this->instrumentRepository = $instrumentRepository;
        $this->instrumentTypeRepository = $instrumentTypeRepository;
        $this->proposalRepository = $proposalRepository;
        $this->userRepository = $userRepository;
    }

    /**
     * Gets all Repository classes that implement the FilterRepository base class, which is the same as the set of
     * Repositories that contain items that can be filtered on in the GUI.
     *
     * @return Repository[]
     */
    protected function getFilterableRepositories() : array
    {
        return [
            $this->institutionRepository,
            $this->instrumentRepository,
            $this->instrumentTypeRepository,
            $this->proposalRepository,
            $this->userRepository
        ];
    }
}