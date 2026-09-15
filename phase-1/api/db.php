<?php
declare(strict_types=1);

/**
 * Database connection helper — Phase 1's own copy of Phase 0's
 * api/db.php (/plan Section 1: copy, not share).
 *
 * All connection parameters come from environment variables — nothing is
 * hardcoded, per the portability requirement carried over from Phase 0's
 * plan and reused unchanged here: the same code must run unmodified
 * against local Docker MariaDB, a production MySQL/MariaDB host, and a
 * future self-hosted box.
 *
 * Required env vars: DB_HOST, DB_NAME, DB_USER
 * Optional: DB_PORT (default 3306), DB_PASSWORD (default empty)
 *
 * env.php is loaded first so getenv() also picks up values from a local
 * .env file on hosts that don't support setting real process env vars —
 * see env.php's own header comment. It is a pure fallback: any variable
 * already set as a real env var is left untouched.
 */

require_once __DIR__ . '/env.php';

function get_db_connection(): PDO
{
    $host = getenv('DB_HOST');
    $port = getenv('DB_PORT') ?: '3306';
    $name = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $password = getenv('DB_PASSWORD');

    if ($host === false || $host === '' || $name === false || $name === '' || $user === false || $user === '') {
        throw new RuntimeException(
            'Database is not configured: DB_HOST, DB_NAME and DB_USER environment variables are required.'
        );
    }

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    return new PDO($dsn, $user, $password === false ? '' : $password, $options);
}
