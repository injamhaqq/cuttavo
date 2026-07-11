<?php

declare(strict_types=1);

namespace Designbycode\BusinessNameGenerator;

/**
 * Curated word lists used to decorate keywords into brandable names.
 *
 * The lists are intentionally short and hand-picked so generated names stay
 * readable. Consumers can override any list at construction time.
 */
final class WordBank
{
    /** @var list<string> */
    public array $prefixes;

    /** @var list<string> */
    public array $suffixes;

    /** @var list<string> */
    public array $adjectives;

    /** @var list<string> */
    public array $nouns;

    /**
     * @param list<string>|null $prefixes
     * @param list<string>|null $suffixes
     * @param list<string>|null $adjectives
     * @param list<string>|null $nouns
     */
    public function __construct(
        ?array $prefixes = null,
        ?array $suffixes = null,
        ?array $adjectives = null,
        ?array $nouns = null,
    ) {
        $this->prefixes = $prefixes ?? self::defaultPrefixes();
        $this->suffixes = $suffixes ?? self::defaultSuffixes();
        $this->adjectives = $adjectives ?? self::defaultAdjectives();
        $this->nouns = $nouns ?? self::defaultNouns();
    }

    /** @return list<string> */
    public static function defaultPrefixes(): array
    {
        return [
            'get', 'go', 'try', 'my', 'the', 'we', 'up', 'on',
            'nova', 'meta', 'hyper', 'neo', 'omni', 'prime',
        ];
    }

    /** @return list<string> */
    public static function defaultSuffixes(): array
    {
        return [
            'ly', 'ify', 'io', 'ify', 'hq', 'ex', 'ora', 'ora',
            'ify', 'able', 'wise', 'flow', 'base', 'sync',
        ];
    }

    /** @return list<string> */
    public static function defaultAdjectives(): array
    {
        return [
            'swift', 'bright', 'bold', 'prime', 'clever', 'sharp',
            'rapid', 'lucid', 'vivid', 'agile', 'crisp', 'true',
        ];
    }

    /** @return list<string> */
    public static function defaultNouns(): array
    {
        return [
            'hub', 'lab', 'labs', 'works', 'forge', 'craft', 'nest',
            'yard', 'stack', 'spark', 'peak', 'point', 'studio', 'wave',
        ];
    }
}
