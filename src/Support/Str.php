<?php

declare(strict_types=1);

namespace Designbycode\BusinessNameGenerator\Support;

/**
 * Small string helpers used when assembling generated names.
 */
final class Str
{
    /**
     * Upper-case the first character of a word, leaving the rest untouched.
     */
    public static function ucfirst(string $value): string
    {
        if ($value === '') {
            return $value;
        }

        return mb_strtoupper(mb_substr($value, 0, 1)) . mb_substr($value, 1);
    }

    /**
     * Normalise a keyword to lower-case, trimmed, without surrounding noise.
     */
    public static function normalize(string $value): string
    {
        return mb_strtolower(trim($value));
    }

    /**
     * Strip common trailing vowels so blended names read cleanly.
     * "cloud" + "ify" stays "cloudify" but "data" + "afy" -> "datafy".
     */
    public static function trimTrailingVowel(string $value): string
    {
        return preg_replace('/[aeiou]+$/i', '', $value) ?? $value;
    }

    /**
     * "TitleCase" a full multi-word string.
     */
    public static function studly(string $value): string
    {
        $words = preg_split('/[\s\-_]+/', trim($value)) ?: [];

        return implode('', array_map(static fn (string $word): string => self::ucfirst($word), $words));
    }
}
