-- Phase 1 contact_requests table.
--
-- Portability requirement (per /plan Section 8, carried over from Phase
-- 0's approved plan): standard MySQL/MariaDB SQL only — no
-- vendor-specific features — so this runs unchanged against local Docker
-- MariaDB, production managed MySQL/MariaDB, and a future self-hosted
-- box.
--
-- Unlike Phase 0's `signups` table, there is deliberately NO unique
-- constraint on email: design-spec.md 2.7 treats a second contact
-- submission as a normal additional message, not a duplicate to
-- collapse, so every submission gets its own row (see api/contact.php).
--
-- flagged_items stores a JSON array of item IDs as TEXT rather than a
-- native JSON column type, so this schema stays portable to older
-- MySQL/MariaDB versions that may not support the JSON column type
-- (matches the "standard SQL only" constraint) — validity is enforced in
-- application code (api/contact.php), not by the database.
--
-- notified_at is set only if api/contact.php's best-effort mail() call
-- actually succeeded — NULL means either notification hasn't been
-- attempted successfully yet or NOTIFY_EMAIL isn't configured. This is
-- the queryable "did the notification actually go out" fallback source
-- of truth (/plan Section 6), same "DB is truth, not the notification
-- channel" principle Phase 0 already established for GA4 vs. `signups`.

CREATE TABLE IF NOT EXISTS contact_requests (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email          VARCHAR(254) NOT NULL,
    flagged_items  TEXT NULL,
    message        TEXT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notified_at    TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
