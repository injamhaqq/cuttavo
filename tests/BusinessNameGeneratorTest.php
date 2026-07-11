<?php

declare(strict_types=1);

namespace Designbycode\BusinessNameGenerator\Tests;

use Designbycode\BusinessNameGenerator\BusinessNameGenerator;
use Designbycode\BusinessNameGenerator\Pattern;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class BusinessNameGeneratorTest extends TestCase
{
    public function test_it_generates_the_requested_number_of_names(): void
    {
        $names = (new BusinessNameGenerator())
            ->keywords('cloud')
            ->count(15)
            ->generate();

        $this->assertCount(15, $names);
        foreach ($names as $name) {
            $this->assertNotSame('', $name);
        }
    }

    public function test_names_are_unique_by_default(): void
    {
        $names = (new BusinessNameGenerator())
            ->keywords(['cloud', 'data', 'flow'])
            ->count(20)
            ->generate();

        $this->assertSame($names, array_values(array_unique($names)));
    }

    public function test_it_accepts_a_single_string_keyword(): void
    {
        $names = (new BusinessNameGenerator())
            ->keywords('rocket')
            ->count(5)
            ->generate();

        $this->assertCount(5, $names);
    }

    public function test_generate_one_returns_a_single_name(): void
    {
        $name = (new BusinessNameGenerator())
            ->keywords('spark')
            ->generateOne();

        $this->assertIsString($name);
        $this->assertNotSame('', $name);
    }

    public function test_prefix_pattern_prepends_a_prefix(): void
    {
        $names = (new BusinessNameGenerator())
            ->keywords('cloud')
            ->usingPatterns([Pattern::Prefix])
            ->count(20)
            ->generate();

        foreach ($names as $name) {
            $this->assertStringEndsWith('Cloud', $name);
        }
    }

    public function test_domain_pattern_appends_io(): void
    {
        $names = (new BusinessNameGenerator())
            ->keywords('data')
            ->usingPatterns([Pattern::Domain])
            ->count(3)
            ->allowDuplicates()
            ->generate();

        foreach ($names as $name) {
            $this->assertSame('Data.io', $name);
        }
    }

    public function test_noun_pattern_starts_with_the_keyword(): void
    {
        $names = (new BusinessNameGenerator())
            ->keywords('data')
            ->usingPatterns([Pattern::Noun])
            ->count(20)
            ->generate();

        foreach ($names as $name) {
            $this->assertStringStartsWith('Data', $name);
        }
    }

    public function test_empty_keyword_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new BusinessNameGenerator())->keywords('   ');
    }

    public function test_zero_count_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new BusinessNameGenerator())->count(0);
    }

    public function test_empty_pattern_list_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new BusinessNameGenerator())->usingPatterns([]);
    }

    public function test_generate_without_keywords_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new BusinessNameGenerator())->generate();
    }
}
