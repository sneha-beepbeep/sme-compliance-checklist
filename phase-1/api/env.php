<?php
declare(strict_types=1);

/**
 * Minimal .env file loader — Phase 1's own copy of Phase 0's
 * api/env.php (/plan Section 1: copy, not share, so Phase 0 and Phase 1
 * stay independently deployable/rollback-able from each other).
 *
 * The portability requirement from /plan is "DB config entirely via
 * environment variables" — but that assumes the hosting environment lets
 * you set real process-level env vars for PHP. Local Docker does (see
 * docker-compose.yml's `environment:` block). Whether the real
 * production host (lima-city, per /plan Section 1 — same account as
 * Phase 0) does is inherited as the same open question Phase 0 already
 * carried: shared/managed PHP hosting commonly doesn't expose arbitrary
 * process env vars to tenants.
 *
 * This loader is a bridge, not a replacement: if a variable is already
 * set as a real env var, getenv() already returns it and this file
 * changes nothing for that key. It only fills in gaps by reading a plain
 * KEY=VALUE .env file — so `getenv()` remains the single read path
 * everywhere in the app (api/db.php, public/config.php, api/contact.php).
 *
 * The .env file itself must never be web-accessible — see public/
 * .htaccess's deny rule. It must never be committed — see the repo's
 * top-level .gitignore (phase-1/.env is covered by the same
 * per-phase .env pattern Phase 0 established).
 *
 * NOT VERIFIED against a real production host yet for Phase 1
 * specifically — same caveat Phase 0 carried before its own Day 2 real
 * deploy; confirm on Phase 1's actual first real deploy.
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

// Default: phase-1/.env, i.e. one directory above this file (api/ ->
// phase-1/). Overridable via APP_ENV_FILE for hosts that need the file
// placed somewhere else (e.g. outside the web root entirely).
$appEnvFile = getenv('APP_ENV_FILE');
if ($appEnvFile === false || $appEnvFile === '') {
    $appEnvFile = dirname(__DIR__) . '/.env';
}

load_env_file($appEnvFile);
