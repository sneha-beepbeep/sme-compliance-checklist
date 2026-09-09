<?php
declare(strict_types=1);

/**
 * Minimal .env file loader.
 *
 * The portability requirement from /plan is "DB config entirely via
 * environment variables" — but that assumes the hosting environment lets
 * you set real process-level env vars for PHP. Local Docker does (see
 * docker-compose.yml's `environment:` block). Whether lima-city's shared/
 * managed PHP hosting does is UNVERIFIED — shared hosts commonly run
 * mod_php or a shared PHP-FPM pool where tenants cannot set arbitrary
 * process env vars, only per-vhost Apache `SetEnv` (needs mod_env) or a
 * control-panel-specific mechanism.
 *
 * This loader is a bridge, not a replacement: if a variable is already
 * set as a real env var (Docker, Apache SetEnv, a future host that does
 * support it), getenv() already returns it and this file changes nothing
 * for that key. It only fills in gaps by reading a plain KEY=VALUE .env
 * file — so `getenv()` remains the single read path everywhere in the
 * app (api/db.php, public/config.php), and env vars stay the actual
 * source of truth; this just makes them settable via a file on hosts that
 * don't expose real env var injection.
 *
 * The .env file itself must never be web-accessible — see public/
 * .htaccess's deny rule for `.env`. It must never be committed — see
 * the repo's top-level .gitignore.
 *
 * NOT VERIFIED against lima-city's actual PHP configuration (SAPI,
 * mod_php vs PHP-FPM, whether putenv()/getenv() are restricted by the
 * host). Confirm on the real Day 2 deploy; if lima-city does support
 * setting real env vars (e.g. via its control panel), prefer that and
 * this loader simply becomes a no-op for every key that's already set.
 */

function load_env_file(string $path): void
{
    if (!is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }

        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }

        [$key, $value] = $parts;
        $key = trim($key);
        $value = trim($value);

        // Strip one layer of matching surrounding quotes, if present.
        $len = strlen($value);
        if ($len >= 2 && (
            ($value[0] === '"' && $value[$len - 1] === '"') ||
            ($value[0] === "'" && $value[$len - 1] === "'")
        )) {
            $value = substr($value, 1, -1);
        }

        // Never override a real, already-set environment variable — a
        // genuine process env var always wins over the file fallback.
        if ($key !== '' && getenv($key) === false) {
            putenv($key . '=' . $value);
        }
    }
}

// Default: phase-0/.env, i.e. one directory above this file (api/ ->
// phase-0/). Overridable via APP_ENV_FILE for hosts that need the file
// placed somewhere else (e.g. outside the web root entirely).
$appEnvFile = getenv('APP_ENV_FILE');
if ($appEnvFile === false || $appEnvFile === '') {
    $appEnvFile = dirname(__DIR__) . '/.env';
}

load_env_file($appEnvFile);
