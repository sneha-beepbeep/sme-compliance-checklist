<?php
declare(strict_types=1);

/**
 * Runtime frontend config, served as JS.
 *
 * Currently exposes only GA_MEASUREMENT_ID, sourced from the
 * GA_MEASUREMENT_ID environment variable — never hardcoded in JS source.
 * A real GA4 property/Measurement ID does not exist yet as of this
 * writing; until GA_MEASUREMENT_ID is set (in .env or a real env var),
 * this deliberately emits `null`, and analytics.js is written to skip
 * loading gtag.js entirely rather than requesting a fake/placeholder ID.
 *
 * Loaded as a plain <script> tag by index.html, before analytics.js, so
 * window.GA_MEASUREMENT_ID is defined by the time analytics.js runs.
 * Not cached client-side (no-store) since this can change between
 * deploys without a build step.
 */

// Path is relative to the DEPLOYED layout, not this repo's source layout:
// public/ and api/ are merged into one document root in both local
// Docker (see Dockerfile) and the intended lima-city deploy (see
// deploy/deploy.sh), so this file ends up as a sibling of api/, not
// inside a public/ subdirectory — i.e. __DIR__ . '/api/env.php', not
// '../api/env.php'. (Caught by testing this file against a merged
// docroot exactly like Dockerfile's — see the /build Day 2 prep notes.)
require_once __DIR__ . '/api/env.php';

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store');

$gaId = getenv('GA_MEASUREMENT_ID');
$value = ($gaId === false || trim($gaId) === '') ? null : trim($gaId);

echo 'window.GA_MEASUREMENT_ID = ' . json_encode($value) . ';';
