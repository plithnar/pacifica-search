<?php

namespace PacificaSearchBundle\Repository;

/**
 * Class FilterRepository
 *
 * Base class for repositories of types that can be included in a search filter
 */
abstract class FilterRepository extends Repository
{
    /**
     * We store names of implementing classes statically on the assumption that we aren't dynamically declaring new
     * Repository classes, because that would be insane.
     * @var string[]
     */
    private static $implementingClassNames;

    /**
     * Returns an array of the names of all classes that extend this class
     * @return string[]
     */
    public static function getImplementingClassNames()
    {
        if (self::$implementingClassNames === null) {
            self::requireAllRelatedClassFiles();

            self::$implementingClassNames = array_filter(get_declared_classes(), function ($class) {
                return is_subclass_of($class, self::class);
            });
        }

        return self::$implementingClassNames;
    }

    /**
     * Ensure that all files declaring classes that implement this base class are included
     */
    private static function requireAllRelatedClassFiles()
    {
        foreach (glob(__DIR__ . "/*.php") as $filename) {
            require_once($filename);
        }
    }
}
