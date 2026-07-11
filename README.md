# Business Name Generator

Generate creative, brandable business names from keywords using a variety of
naming patterns and curated word lists.

## Installation

```bash
composer require designbycode/business-name-generator
```

Requires PHP 8.1+.

## Usage

```php
use Designbycode\BusinessNameGenerator\BusinessNameGenerator;

$names = (new BusinessNameGenerator())
    ->keywords(['cloud', 'data'])
    ->count(10)
    ->generate();

// [ "GetCloud", "Dataify", "SwiftCloud", "CloudForge", "CloudData", "Data.io", ... ]
```

Generate a single name:

```php
$name = (new BusinessNameGenerator())
    ->keywords('rocket')
    ->generateOne(); // e.g. "RocketLabs"
```

## Naming patterns

Each generated name is produced by one of six patterns. By default all patterns
are used; restrict them with `usingPatterns()`.

| Pattern              | Example (keyword `cloud`) |
| -------------------- | ------------------------- |
| `Pattern::Prefix`    | `GetCloud`, `NovaCloud`   |
| `Pattern::Suffix`    | `Cloudly`, `Cloudify`     |
| `Pattern::Adjective` | `SwiftCloud`, `BoldCloud` |
| `Pattern::Noun`      | `CloudHub`, `CloudForge`  |
| `Pattern::Blend`     | `CloudData`               |
| `Pattern::Domain`    | `Cloud.io`                |

```php
use Designbycode\BusinessNameGenerator\Pattern;

$names = (new BusinessNameGenerator())
    ->keywords('cloud')
    ->usingPatterns([Pattern::Prefix, Pattern::Noun])
    ->count(5)
    ->generate();
```

## Options

```php
$generator = new BusinessNameGenerator();

$generator
    ->keywords('flow')          // string or array of keywords (required)
    ->count(20)                 // how many names to return (default 10)
    ->allowDuplicates()         // keep duplicates instead of filtering (default off)
    ->usingPatterns([...])      // limit to specific patterns
    ->generate();
```

## Custom word lists

Provide your own prefixes, suffixes, adjectives, or nouns via `WordBank`:

```php
use Designbycode\BusinessNameGenerator\BusinessNameGenerator;
use Designbycode\BusinessNameGenerator\WordBank;

$wordBank = new WordBank(
    prefixes: ['neo', 'zen'],
    nouns: ['forge', 'atlas'],
);

$names = (new BusinessNameGenerator($wordBank))
    ->keywords('build')
    ->generate();
```

## Testing

```bash
composer install
composer test
```

## License

MIT — see [LICENSE](LICENSE).
