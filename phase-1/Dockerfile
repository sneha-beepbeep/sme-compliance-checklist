# Local development / dev-parity environment only — Phase 1's own copy of
# Phase 0's Dockerfile pattern (/plan Section 1: replicate, not share).
#
# Per the approved Phase 0 plan (reused here): managed hosting of this
# stack's kind deploys via plain git/SSH (rsync in practice — see
# deploy/deploy.sh), not by running this container. This image exists so
# the wizard, persistence, and contact endpoint can be built and fully
# exercised locally, and so a future self-hosted migration has a working
# container to start from.

FROM php:8.2-apache

# pdo_mysql is required by api/db.php to talk to MySQL/MariaDB.
RUN docker-php-ext-install pdo pdo_mysql

# mod_rewrite is required for the canonical-URL rules in public/.htaccess.
RUN a2enmod rewrite

# php:apache's default vhost sets AllowOverride None; the canonical-URL
# and .env/.sql deny rules in public/.htaccess depend on AllowOverride
# All to take effect locally — mirrors the same requirement flagged for
# the real production deploy in public/.htaccess's own comments.
RUN { \
      echo '<Directory /var/www/html>'; \
      echo '    AllowOverride All'; \
      echo '</Directory>'; \
    } > /etc/apache2/conf-available/allow-override.conf \
    && a2enconf allow-override

# public/ and api/ are merged at the container's web root, matching the
# document-root-dedicated-to-this-app assumption documented in
# public/.htaccess and public/assets/checklist.js's contact-endpoint URL.
COPY public/ /var/www/html/
COPY api/ /var/www/html/api/
