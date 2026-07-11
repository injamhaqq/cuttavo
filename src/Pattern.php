<?php

declare(strict_types=1);

namespace Designbycode\BusinessNameGenerator;

/**
 * The naming strategies the generator can apply to a keyword.
 */
enum Pattern: string
{
    /** e.g. "GetCloud", "GoData" */
    case Prefix = 'prefix';

    /** e.g. "Cloudly", "Dataify" */
    case Suffix = 'suffix';

    /** e.g. "SwiftCloud", "BrightData" */
    case Adjective = 'adjective';

    /** e.g. "CloudHub", "DataForge" */
    case Noun = 'noun';

    /** e.g. "CloudData" — two keywords blended together */
    case Blend = 'blend';

    /** e.g. "Cloud.io", "Data.io" — domain-style hack */
    case Domain = 'domain';

    /**
     * All patterns, useful as a sensible default set.
     *
     * @return list<self>
     */
    public static function all(): array
    {
        return self::cases();
    }
}
