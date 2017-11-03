<?php

namespace PacificaSearchBundle\Model;

/**
 * Class InstrumentType
 *
 * Note that this model maps to the "Group" ElasticSearch type by way of the "InstrumentGroup" type.
 */
class InstrumentType extends ElasticSearchType
{
    /** @var string */
    private $name;

    /**
     * InstrumentType constructor.
     * @param int $id
     * @param string $name
     */
    public function __construct($id, $name)
    {
        $this->name = $name;
        parent::__construct($id);
    }

    /**
     * @inheritdoc
     */
    public function getDisplayName()
    {
        return $this->name;
    }

    /**
     * @inheritdoc
     */
    public static function getTypeDisplayName()
    {
        return 'Instrument Type';
    }

    /**
     * @inheritdoc
     */
    public static function getMachineName()
    {
        return 'instrument_type';
    }
}