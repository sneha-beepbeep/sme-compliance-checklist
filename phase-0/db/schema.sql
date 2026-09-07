-- Phase 0 signups table.
--
-- Portability requirement (per the approved plan): standard MySQL/MariaDB
-- SQL only — no vendor-specific (Strato/lima-city-specific) features —
-- so this runs unchanged against local Docker MariaDB, lima-city managed
-- MySQL/MariaDB, and a future self-hosted box.
--
-- Dedup is enforced at the database level via the UNIQUE constraint on
-- email, not in application logic — api/subscribe.php relies on this for
-- its upsert-or-ignore behavior (S0.6: a duplicate submission is a
-- success, not an error).

CREATE TABLE IF NOT EXISTS signups (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email             VARCHAR(254) NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    utm_source        VARCHAR(255) NULL,
    utm_medium        VARCHAR(255) NULL,
    utm_campaign      VARCHAR(255) NULL,
    consent_analytics TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_signups_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
