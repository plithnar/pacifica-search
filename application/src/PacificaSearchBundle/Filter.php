<?php

namespace PacificaSearchBundle;

use PacificaSearchBundle\Model\ElasticSearchType;
use PacificaSearchBundle\Model\File;
use PacificaSearchBundle\Model\Institution;
use PacificaSearchBundle\Model\Instrument;
use PacificaSearchBundle\Model\InstrumentType;
use PacificaSearchBundle\Model\Proposal;
use PacificaSearchBundle\Model\User;

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
     * @param array[] $filterValues Keys are the getMachineName() values of ElasticSearchType classes, values are arrays
     * of IDs:
     *
     * [
     *     'instrument_type' => [ 102 ],
     *     'instrument' => [ 34150, 24151 ],
     *     ...
     * ]
     * @return static
     */
    public static function fromArray(array $filterValues)
    {
        $machineNamesToSetters = self::machineNamesToMethods('set');

        $filterKeys = array_keys($filterValues);
        $machineNames = array_keys($machineNamesToSetters);
        $unexpectedFilterValues = array_diff($filterKeys, $machineNames);
        if (count($unexpectedFilterValues)) {
            throw new \InvalidArgumentException('Filter values array contained unexpected key(s): ' . implode($unexpectedFilterValues));
        }

        $missingFilterValues = array_diff($machineNames, $filterKeys);
        if (count($missingFilterValues)) {
            throw new \InvalidArgumentException('Filter values array is missing expected key(s): ' . implode($missingFilterValues));
        }

        $filter = new static();
        foreach ($machineNamesToSetters as $machineName => $setter) {
            $filter->$setter($filterValues[$machineName]);
        }
        return $filter;
    }

    /**
     * Inverse of fromArray(), returned array format is documented there.
     * @return array
     */
    public function toArray()
    {
        $machineNamesToGetters = self::machineNamesToMethods('get');

        $array = [];
        foreach ($machineNamesToGetters as $machineName => $getter) {
            $array[$machineName] = $this->$getter();
        }
        return $array;
    }

    /**
     * @return bool
     */
    public function isEmpty()
    {
        foreach ($this->toArray() as $vals) {
            if (!empty($vals)) {
                return false;
            }
        }

        return true;
    }

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

    /**
     * Use this method like $filter->setIdsByType(Instrument::class, [1, 2, 3])
     * @param $class
     * @param $value
     * @return $this
     */
    public function setIdsByType($class, $value)
    {
        if (!is_subclass_of($class, ElasticSearchType::class)) {
            throw new \InvalidArgumentException("$class is not a subclass of ElasticSearchType, setByClass() cannot be called on other classes");
        }

        $machineNamesToSetters = self::machineNamesToMethods('set');
        $setter = $machineNamesToSetters[$class::getMachineName()];
        $this->$setter($value);
        return $this;
    }

    /**
     * Retrieves all of the setters or getters mapped to their associated type's machine name
     * @param $prefix
     * @return array
     */
    private static function machineNamesToMethods($prefix)
    {
        if (!in_array($prefix, [ 'set', 'get' ])) {
            throw new \InvalidArgumentException("Unexpected prefix '$prefix'");
        }

        $machineNamesToMethods = [
            InstrumentType::getMachineName() => "${prefix}InstrumentTypeIds",
            Instrument::getMachineName()     => "${prefix}InstrumentIds",
            Institution::getMachineName()    => "${prefix}InstitutionIds",
            User::getMachineName()           => "${prefix}UserIds",
            Proposal::getMachineName()       => "${prefix}ProposalIds"
        ];
        return $machineNamesToMethods;
    }
}
