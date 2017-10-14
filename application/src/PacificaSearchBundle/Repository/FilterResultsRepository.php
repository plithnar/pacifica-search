<?php

namespace PacificaSearchBundle\Repository;

/**
 * Class FilterResultsRepository
 */
class FilterResultsRepository
{
    /**
     * Gets the results of a filter
     * TODO: Implement and document filter
     * @return array
     */
    public function getResults($filter)
    {
        return [
            "instrument_types" => [
                ["id" => "1", "name" => "Instrument Type 1"],
                ["id" => "2", "name" => "Instrument Type 2"],
                ["id" => "3", "name" => "Instrument Type 3"]
            ],
            "instruments" => [
                ["id" => "1", "name" => "Instrument 1"],
                ["id" => "2", "name" => "Instrument 2"],
                ["id" => "3", "name" => "Instrument 3"]
            ],
            "institutions" => [
                ["id" => "1", "name" => "Institution 1"],
                ["id" => "2", "name" => "Institution 2"],
                ["id" => "3", "name" => "Institution 3"]
            ],
            "users" => [
                ["id" => "1", "name" => "User 1"],
                ["id" => "2", "name" => "User 2"],
                ["id" => "3", "name" => "User 3"]
            ],
            "proposals" => [
                ["id" => "1", "name" => "Proposal 1"],
                ["id" => "2", "name" => "Proposal 2"],
                ["id" => "3", "name" => "Proposal 3"]
            ]
        ];
    }
}