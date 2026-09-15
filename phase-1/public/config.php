<?php
declare(strict_types=1);

/**
 * Runtime frontend config, served as JS. Phase 1's own copy of Phase 0's
 * public/config.php pattern (/plan Section 7) — separate instance
 * because Phase 1 is a separate deployable app on its own subdomain.
 *
 * Currently exposes only GA_MEASUREMENT_ID, sourced from the
 * GA_MEASUREMENT_ID environment variable — never hardcoded in JS source.
 * No real GA4 property/Measurement ID exists for Phase 1 yet (/plan Open
 * Question 7 — same property as Phase 0 or a new one is a GA4-admin
 * decision). Until GA_MEASUREMENT_ID is set, this deliberately emits
 * `null`, and analytics.js is written to skip loading gtag.js entirely
 * rather than requesting a fake/placeholder ID.
 *
 * Loaded as a plain <script> tag by index.html, before analytics.js, so
 * window.GA_MEASUREMENT_ID is defined by the time analytics.js runs.
 * Not cached client-side (no-store) since this can change between
 * deploys without a build step.
 */

// Path is relative to the DEPLOYED layout, not this repo's source layout:
// public/ and api/ are merged into one document root in both local
// Docker (see Dockerfile) and the intended lima-city deploy (see
// deploy/deploy.sh) — this file ends up as a sibling of api/, not inside
// a public/ subdirectory. Same fix Phase 0 needed after a real Day-2
// path bug (see phase-0/README.md's "What's verified locally" section);
// applied here from the start rather than rediscovering it.
require_once __DIR__ . '/api/env.php';

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store');

$gaId = getenv('GA_MEASUREMENT_ID');
$value = ($gaId === false || trim($gaId) === '') ? null : trim($gaId);

echo 'window.GA_MEASUREMENT_ID = ' . json_encode($value) . ';';
