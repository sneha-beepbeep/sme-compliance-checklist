<?php
declare(strict_types=1);

/**
 * POST /api/subscribe.php
 *
 * Body (JSON): {
 *   "email": string,
 *   "utm_source"?: string, "utm_medium"?: string, "utm_campaign"?: string,
 *   "consent_analytics"?: bool
 * }
 *
 * Response (JSON): { "ok": true } on success — including the duplicate-
 * email case (design-spec.md S0.6: a repeat signup is a success, not an
 * error, so the frontend never needs to branch on it) — or
 * { "ok": false, "error": string } with a non-2xx status on failure
 * (S0.2 field-validation errors, S0.5 server/network errors).
 */

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

function json_response(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw !== false ? $raw : '', true);

if (!is_array($data)) {
    // Fall back to a standard form-encoded submission in case the client
    // ever posts as application/x-www-form-urlencoded instead of JSON.
    $data = $_POST;
}

$email = trim((string)($data['email'] ?? ''));

if ($email === '') {
    json_response(400, ['ok' => false, 'error' => 'Enter your email to get notified.']);
}

if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(400, ['ok' => false, 'error' => "That doesn't look like a valid email."]);
}

$utmSource = isset($data['utm_source']) && $data['utm_source'] !== null
    ? substr((string)$data['utm_source'], 0, 255) : null;
$utmMedium = isset($data['utm_medium']) && $data['utm_medium'] !== null
    ? substr((string)$data['utm_medium'], 0, 255) : null;
$utmCampaign = isset($data['utm_campaign']) && $data['utm_campaign'] !== null
    ? substr((string)$data['utm_campaign'], 0, 255) : null;
$consentAnalytics = !empty($data['consent_analytics']) ? 1 : 0;

try {
    $pdo = get_db_connection();

    // Upsert-or-ignore: the UNIQUE constraint on email (see db/schema.sql)
    // is the actual dedup mechanism, not an app-level "check then insert"
    // (which would race). ON DUPLICATE KEY UPDATE with a no-op assignment
    // is the standard MySQL idiom for this — unlike INSERT IGNORE, it
    // doesn't also swallow unrelated errors (e.g. a truncation warning)
    // silently.
    $stmt = $pdo->prepare(
        'INSERT INTO signups (email, utm_source, utm_medium, utm_campaign, consent_analytics)
         VALUES (:email, :utm_source, :utm_medium, :utm_campaign, :consent_analytics)
         ON DUPLICATE KEY UPDATE id = id'
    );
    $stmt->execute([
        ':email'             => $email,
        ':utm_source'        => $utmSource,
        ':utm_medium'        => $utmMedium,
        ':utm_campaign'      => $utmCampaign,
        ':consent_analytics' => $consentAnalytics,
    ]);

    json_response(200, ['ok' => true]);
} catch (Throwable $e) {
    error_log('[subscribe] ' . $e->getMessage());
    json_response(500, ['ok' => false, 'error' => 'Something went wrong — please try again.']);
}
