<?php

declare(strict_types=1);

namespace Designbycode\BusinessNameGenerator;

use Designbycode\BusinessNameGenerator\Support\Str;
use InvalidArgumentException;

/**
 * Generate creative, brandable business names from one or more keywords.
 *
 * Example:
 *
 *     $names = (new BusinessNameGenerator())
 *         ->keywords(['cloud', 'data'])
 *         ->count(10)
 *         ->generate();
 */
final class BusinessNameGenerator
{
    /** @var list<string> */
    private array $keywords = [];

    /** @var list<Pattern> */
    private array $patterns;

    private int $count = 10;

    private bool $unique = true;

    private WordBank $wordBank;

    /**
     * @param list<Pattern>|null $patterns Restrict generation to these patterns.
     */
    public function __construct(?WordBank $wordBank = null, ?array $patterns = null)
    {
        $this->wordBank = $wordBank ?? new WordBank();
        $this->patterns = $patterns ?? Pattern::all();
    }

    /**
     * Set the seed keyword(s) the names are built from.
     *
     * @param string|list<string> $keywords
     */
    public function keywords(string|array $keywords): self
    {
        $keywords = is_string($keywords) ? [$keywords] : $keywords;

        $normalized = [];
        foreach ($keywords as $keyword) {
            $keyword = Str::normalize($keyword);
            if ($keyword !== '') {
                $normalized[] = $keyword;
            }
        }

        if ($normalized === []) {
            throw new InvalidArgumentException('At least one non-empty keyword is required.');
        }

        $this->keywords = array_values(array_unique($normalized));

        return $this;
    }

    /**
     * How many names to return. Must be a positive integer.
     */
    public function count(int $count): self
    {
        if ($count < 1) {
            throw new InvalidArgumentException('Count must be at least 1.');
        }

        $this->count = $count;

        return $this;
    }

    /**
     * Restrict generation to a subset of patterns.
     *
     * @param list<Pattern> $patterns
     */
    public function usingPatterns(array $patterns): self
    {
        if ($patterns === []) {
            throw new InvalidArgumentException('At least one pattern is required.');
        }

        $this->patterns = array_values($patterns);

        return $this;
    }

    /**
     * Toggle whether duplicate names are filtered out (default true).
     */
    public function allowDuplicates(bool $allow = true): self
    {
        $this->unique = ! $allow;

        return $this;
    }

    /**
     * Generate the requested number of business names.
     *
     * @return list<string>
     */
    public function generate(): array
    {
        if ($this->keywords === []) {
            throw new InvalidArgumentException('Call keywords() before generate().');
        }

        $names = [];
        $attempts = 0;
        $maxAttempts = $this->count * 50;

        while (count($names) < $this->count && $attempts < $maxAttempts) {
            $attempts++;

            $keyword = $this->keywords[array_rand($this->keywords)];
            $pattern = $this->patterns[array_rand($this->patterns)];

            $name = $this->applyPattern($pattern, $keyword);

            if ($name === '') {
                continue;
            }

            if ($this->unique && in_array($name, $names, true)) {
                continue;
            }

            $names[] = $name;
        }

        return $names;
    }

    /**
     * Generate a single business name.
     */
    public function generateOne(): string
    {
        return $this->count(1)->generate()[0];
    }

    private function applyPattern(Pattern $pattern, string $keyword): string
    {
        $word = Str::ucfirst($keyword);

        return match ($pattern) {
            Pattern::Prefix => Str::ucfirst($this->pick($this->wordBank->prefixes)) . $word,
            Pattern::Suffix => Str::trimTrailingVowel($word) . $this->pick($this->wordBank->suffixes),
            Pattern::Adjective => Str::ucfirst($this->pick($this->wordBank->adjectives)) . $word,
            Pattern::Noun => $word . Str::ucfirst($this->pick($this->wordBank->nouns)),
            Pattern::Blend => $this->blend($keyword),
            Pattern::Domain => $word . '.io',
        };
    }

    private function blend(string $keyword): string
    {
        // Blend with another keyword when available, otherwise fall back to a noun.
        $others = array_values(array_filter(
            $this->keywords,
            static fn (string $k): bool => $k !== $keyword,
        ));

        $partner = $others === []
            ? $this->pick($this->wordBank->nouns)
            : $this->pick($others);

        return Str::ucfirst($keyword) . Str::ucfirst($partner);
    }

    /**
     * @param list<string> $list
     */
    private function pick(array $list): string
    {
        return $list[array_rand($list)];
    }
}
