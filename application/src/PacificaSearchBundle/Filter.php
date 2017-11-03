<?php

namespace PacificaSearchBundle;

/**
 * Class Filter
 *
 * Represents the facets that have been selected by the user to restrict the set of further Filter options and Files
 * that are to be shown to the user
 */
class Filter
{
    /**
     * IDs of instrument types that are included in this filter
     * @var integer[]
     */
    private $instrumentTypeIds = [];

    /**
     * IDs of instruments that are included in this filter
     * @var integer[]
     */
    private $instrumentIds = [];

    /**
     * IDs of institutions that are included in this filter
     * @var integer[]
     */
    private $institutionIds = [];

    /**
     * IDs of users that are included in this filter
     * @var integer[]
     */
    private $userIds = [];

    /**
     * IDs of proposals that are included in this filter
     * @var integer[]
     */
    private $proposalIds = [];

    /**
     * @return integer[]
     */
    public function getInstrumentTypeIds(): array
    {
        return $this->instrumentTypeIds;
    }

    /**
     * @param integer[] $instrumentTypeIds
     * @return Filter
     */
    public function setInstrumentTypeIds(array $instrumentTypeIds): Filter
    {
        $this->instrumentTypeIds = $instrumentTypeIds;
        return $this;
    }

    /**
     * @return integer[]
     */
    public function getInstrumentIds(): array
    {
        return $this->instrumentIds;
    }

    /**
     * @param integer[] $instrumentIds
     * @return Filter
     */
    public function setInstrumentIds(array $instrumentIds): Filter
    {
        $this->instrumentIds = $instrumentIds;
        return $this;
    }

    /**
     * @return integer[]
     */
    public function getInstitutionIds(): array
    {
        return $this->institutionIds;
    }

    /**
     * @param integer[] $institutionIds
     * @return Filter
     */
    public function setInstitutionIds(array $institutionIds): Filter
    {
        $this->institutionIds = $institutionIds;
        return $this;
    }

    /**
     * @return integer[]
     */
    public function getUserIds(): array
    {
        return $this->userIds;
    }

    /**
     * @param integer[] $userIds
     * @return Filter
     */
    public function setUserIds(array $userIds): Filter
    {
        $this->userIds = $userIds;
        return $this;
    }

    /**
     * @return integer[]
     */
    public function getProposalIds(): array
    {
        return $this->proposalIds;
    }

    /**
     * @param integer[] $proposalIds
     * @return Filter
     */
    public function setProposalIds(array $proposalIds): Filter
    {
        $this->proposalIds = $proposalIds;
        return $this;
    }
}