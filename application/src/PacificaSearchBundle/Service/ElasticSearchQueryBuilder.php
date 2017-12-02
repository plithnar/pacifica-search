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
    const TYPE_TRANSACTION = 'Transactions';
    const TYPE_FILE = 'Files';

    /**
     * Defines values of fields that must be present in a record for it to be returned
     *
     * @var array[]
     */
    private $fields = [];

    /**
     * Defines nested fields for which a "must exist" filter is defined
     *
     * @var array [
     *   'path' => The name of the child in which the field's value is stored (For child.value, this would be "child")
     *   'field' => The full name of the field (For child.value, this would be "child.value")
     * ]
     */
    private $nestedFieldExists;

    /**
     * The Elasticsearch index that will be queried
     *
     * @var string
     */
    private $index;

    /**
     * The Type that will be queried. One of this class's TYPE_* constants
     *
     * @var string
     */
    private $type;

    /**
     * IDs on which to filter the results of this request
     *
     * @var int[]
     */
    private $ids;

    /**
     * If TRUE then field values will not be returned by the query, instead only metadata will be returned. This is
     * useful primarily for queries that only need to retrieve the ID of a record and don't care about the rest of the
     * data.
     *
     * @var bool
     */
    private $metadataOnly = false;

    public function __construct($index, $type)
    {
        $this->assertValidType($type);

        $this->index = $index;
        $this->type = $type;
    }

    /**
     * Add to the query the requirement that the passed nested field must exist and have a non-empty value
     * @param string $field e.g. "instrument_members.instrument_id"
     * @return ElasticSearchQueryBuilder
     */
    public function whereNestedFieldExists($field)
    {
        // This is probably not hard to implement but it's not required at the moment so I'm skipping supporting it for
        // the sake of time.
        if ($this->nestedFieldExists !== null) {
            throw new \RuntimeException("This class does not currently support multiple must-exist nested fields");
        }

        $this->nestedFieldExists = [
            'path' => $this->getNestedFieldPath($field),
            'field' => $field
        ];

        return $this;
    }

    /**
     * Equivalent to SQL "WHERE {fieldName} = {value}" or "WHERE {fieldName} IN ({values})"
     *
     * @param string $fieldName
     * @param string|string[] $value
     * @return ElasticSearchQueryBuilder
     */
    public function whereEq($fieldName, $value)
    {
        if ($fieldName === 'id') {
            return $this->byId($value);
        }

        $newValues = is_array($value) ? $value : [ $value ];

        if (!array_key_exists($fieldName, $this->fields)) {
            $this->fields[$fieldName] = [];
        }

        $this->fields[$fieldName] = array_merge($this->fields[$fieldName], array_values($newValues));

        return $this;
    }

    /**
     * Alias of whereEq(), for use with multiple values for readability
     * @param $fieldName
     * @param $values
     * @return ElasticSearchQueryBuilder
     */
    public function whereIn($fieldName, $values)
    {
        return $this->whereEq($fieldName, $values);
    }

    /**
     * @param int|int[] $ids
     * @return ElasticSearchQueryBuilder
     */
    public function byId($ids)
    {
        if (!is_array($ids)) {
            $ids = [ $ids ];
        }

        $this->ids = array_values($ids); // array_values() required because IDs queries break on associative arrays

        return $this;
    }

    /**
     * Restricts the query so that it will only retrieve the IDs of the matching fields
     * @return ElasticSearchQueryBuilder
     */
    public function fetchOnlyMetaData()
    {
        $this->metadataOnly = true;
        return $this;
    }

    public function toArray()
    {
        $array = [
            'index' => $this->index,
            'size' =>  10000,
            'type' => $this->type
        ];

        if ($this->metadataOnly) {
            $array['body']['_source'] = false;
        }

        if ($this->ids) {
            $array['body']['query']['ids'] = [
                'type' => $this->type,
                'values' => $this->ids
            ];

            // TODO: The model I started developing with, where you could accumulate query types, just doesn't work.
            // I either need to figure out how to actually make it possible for every type of query to work together,
            // or rearchitect this whole thing to just generate different arrays for each query type. Leaving ugly
            // for now in the interests of getting something working as quickly as possible.
            return $array;
        }

        foreach ($this->fields as $fieldName => $fieldValues) {
            // Check for a nested field name, which requires a different query structure
            $nestedFieldPath = $this->getNestedFieldPath($fieldName);
            if ($nestedFieldPath !== null) {
                $array['body']['query']['nested'] = [
                    'path' => $nestedFieldPath,
                    'query' => [
                        'bool' => [
                            'filter' => [
                                'terms' => [
                                    $fieldName => $fieldValues
                                ]
                            ]
                        ]
                    ]
                ];
            } else {
                $array['body']['query']['bool']['filter'][] = ['terms' => [$fieldName => $fieldValues]];
            }
        }

        if ($this->nestedFieldExists) {
            $array['body']['query']['nested'] = [
                'path' => $this->nestedFieldExists['path'],
                'query' => [
                    'bool' => [
                        'filter' => [
                            'exists' => [
                                'field' => $this->nestedFieldExists['field']
                            ]
                        ]
                    ]
                ]
            ];
        }

        return $array;
    }

    private function assertValidType($type)
    {
        $validTypes = [
            self::TYPE_GROUP,
            self::TYPE_INSITUTION,
            self::TYPE_INSTRUMENT,
            self::TYPE_PROPOSAL,
            self::TYPE_USER,
            self::TYPE_TRANSACTION,
            self::TYPE_FILE
        ];

        if (!in_array($type, $validTypes)) {
            throw new \Exception("Type '$type' is not a valid value. Allowed values are '" . implode(',', $validTypes) . "'");
        }
    }

    /**
     * Given a field name like "path.nestedfield", returns "path". Given a non-nested field name, will return NULL.
     * @param string $field
     * @return string|NULL
     */
    private function getNestedFieldPath($field)
    {
        if (strpos($field, '.') === false) {
            return null;
        }

        $fieldParts = explode('.', $field);

        if (count($fieldParts) != 2) {
            throw new \InvalidArgumentException("Badly formatted nested field, should be in the format [PATH].[FIELD_NAME]");
        }

        $path = reset($fieldParts);
        return $path;
    }
}
