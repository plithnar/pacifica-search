<?php

namespace PacificaSearchBundle\Service;


class ElasticSearchQueryBuilder
{
    /**
     * TYPE_* constants contain the Elasticsearch names of the types. Note that these do NOT map 1:1 to types that
     * are represented by this application's model classes. The reason is that, for example, an InstrumentType is
     * actually a subset of the records from type Group in Elasticsearch.
     */
    const TYPE_GROUP = 'Groups';
    const TYPE_INSTRUMENT = 'Instruments';
    const TYPE_INSITUTION = 'Institutions';
    const TYPE_USER = 'Users';
    const TYPE_PROPOSAL = 'Proposals';

    /**
     * A parameter array suitable to be passed to the Elasticsearch\Client::search() method
     * @var array
     */
    private $params;

    public function __construct($index, $type)
    {
        $this->assertValidType($type);

        $this->params = [
            'index' => $index,
            'size' =>  1000,
            'type' => $type
        ];
    }

    /**
     * Add to the query the requirement that the passed nested field must exist and have a non-empty value
     * @param string $field e.g. "instrument_members.instrument_id"
     * @return ElasticSearchQueryBuilder
     */
    public function whereNestedFieldExists($field)
    {
        // Nested queries require a "path" parameter telling them which parent/child relationship is being targeted.
        // The path is the part of the
        $fieldParts = explode('.', $field);
        $path = reset($fieldParts);

        $this->params['body'] = [
            'query' => [
                'nested' => [
                    'path' => $path,
                    'query' => [
                        'bool' => [
                            'filter' => [
                                'exists' => [
                                    'field' => $field
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];

        return $this;
    }

    public function toArray()
    {
        return $this->params;
    }

    private function assertValidType($type)
    {
        $validTypes = [
            self::TYPE_GROUP,
            self::TYPE_INSITUTION,
            self::TYPE_INSTRUMENT,
            self::TYPE_PROPOSAL,
            self::TYPE_USER
        ];

        if (!in_array($type, $validTypes)) {
            throw new \Exception("Type '$type' is not a valid value. Allowed values are '" . implode(',', $validTypes) . "'");
        }
    }
}