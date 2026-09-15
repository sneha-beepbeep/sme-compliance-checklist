<?php
declare(strict_types=1);

/**
 * POST /api/contact.php
 *
 * Backend for S1.6's "Still stuck? Talk to us" contact form — the single
 * conversion-critical action in Phase 1 (it's what feeds US-10's
 * sales/CS notification), so this follows subscribe.php's
 * validation/no-silent-failure discipline exactly (/plan Section 6).
 *
 * Body (JSON): {
 *   "email": string,
 *   "items"?: string[]   — item IDs the visitor still wants help with,
 *                           pre-populated from the flagged results but
 *                           editable/deselectable client-side
 *                           (design-spec.md 2.2 step 5),
 *   "message"?: string   — free-text context, optional
 * }
 *
 * Response (JSON): { "ok": true } on success, or
 * { "ok": false, "error": string } with a non-2xx status on failure
 * (S1.8: field validation or a genuine server/DB error).
 *
 * Unlike subscribe.php, there is deliberately NO uniqueness constraint /
 * dedup here: design-spec.md 2.7 treats a second contact submission as a
 * normal additional message, not an error or a duplicate to collapse —
 * every submission becomes its own row.
 *
 * Notification (US-10, opt-in trigger — design-spec.md 2.2 step 7 / 2.7):
 * a best-effort PHP mail() to NOTIFY_EMAIL is attempted after a
 * successful insert. A failed/unavailable mail() send does NOT fail the
 * user's submission — the row in `contact_requests` is the source of
 * truth (mirrors Phase 0's "signups table, not GA4, is the source of
 * truth" lesson from /plan Section 6 and the design-spec.md 1.4 edge
 * case); `notified_at IS NULL` is the queryable fallback to find
 * requests whose notification didn't go out.
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
    // Fall back to a standard form-encoded submission, same defensive
    // pattern as subscribe.php.
    $data = $_POST;
}

$email = trim((string)($data['email'] ?? ''));

if ($email === '') {
    json_response(400, ['ok' => false, 'error' => 'Enter your email so we can follow up.']);
}

if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(400, ['ok' => false, 'error' => "That doesn't look like a valid email."]);
}

// Item IDs: accept only strings, cap count and per-item length so a
// malformed/adversarial payload can't produce an unbounded row.
$itemsInput = $data['items'] ?? [];
if (!is_array($itemsInput)) {
    $itemsInput = [];
}
$items = [];
foreach ($itemsInput as $candidate) {
    if (!is_string($candidate)) {
        continue;
    }
    $candidate = trim($candidate);
    if ($candidate === '') {
        continue;
    }
    $items[] = substr($candidate, 0, 100);
    if (count($items) >= 20) {
        break;
    }
}

$message = isset($data['message']) ? trim((string)$data['message']) : '';
if (strlen($message) > 2000) {
    $message = substr($message, 0, 2000);
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->prepare(
        'INSERT INTO contact_requests (email, flagged_items, message)
         VALUES (:email, :flagged_items, :message)'
    );
    $stmt->execute([
        ':email'         => $email,
        ':flagged_items' => json_encode(array_values($items)),
        ':message'       => $message !== '' ? $message : null,
    ]);

    $requestId = (int)$pdo->lastInsertId();

    // Best-effort notification (US-10). Never allowed to turn a
    // successfully-recorded request into a user-visible failure — see
    // this file's header comment.
    $notifyEmail = getenv('NOTIFY_EMAIL');
    if ($notifyEmail !== false && trim($notifyEmail) !== '') {
        $to = trim($notifyEmail);
        $subject = 'Checklist contact request';
        $bodyLines = [
            'A visitor submitted the Phase 1 checklist contact form.',
            '',
            'Email: ' . $email,
            'Items requested: ' . (count($items) > 0 ? implode(', ', $items) : '(none selected)'),
            'Message: ' . ($message !== '' ? $message : '(none)'),
        ];
        $headers = 'From: no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\r\n" .
            'Content-Type: text/plain; charset=utf-8';

        // @-suppressed deliberately: mail()'s own warnings are not
        // actionable to the visitor and must never surface as a
        // submission failure. Success/failure is still recorded via
        // notified_at below and via error_log for operational visibility.
        $sent = @mail($to, $subject, implode("\n", $bodyLines), $headers);

        if ($sent) {
            $update = $pdo->prepare('UPDATE contact_requests SET notified_at = NOW() WHERE id = :id');
            $update->execute([':id' => $requestId]);
        } else {
            error_log('[contact] mail() returned false for contact_requests.id=' . $requestId);
        }
    }

    json_response(200, ['ok' => true]);
} catch (Throwable $e) {
    error_log('[contact] ' . $e->getMessage());
    json_response(500, ['ok' => false, 'error' => 'Something went wrong — please try again.']);
}
