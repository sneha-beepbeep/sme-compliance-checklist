# Local development / dev-parity environment only.
#
# Per the approved plan: Strato/lima-city-style managed hosting deploys
# via plain git/SSH, not by running this container — this image exists so
# Day 1 can be built and fully exercised locally without lima-city
# credentials, and so the eventual self-hosted migration has a working
# container to start from. It is not the Day 2 deploy artifact.

FROM php:8.2-apache

# pdo_mysql is required by api/db.php to talk to MySQL/MariaDB.
RUN docker-php-ext-install pdo pdo_mysql

# mod_rewrite is required for the canonical-URL rules in public/.htaccess.
RUN a2enmod rewrite

# php:apache's default vhost sets AllowOverride None; the canonical-URL
# rules in public/.htaccess depend on AllowOverride All to take effect —
# mirrors the AllowOverride requirement flagged for the real lima-city
# deploy in public/.htaccess's own comments.
RUN { \
      echo '<Directory /var/www/html>'; \
      echo '    AllowOverride All'; \
      echo '</Directory>'; \
    } > /etc/apache2/conf-available/allow-override.conf \
    && a2enconf allow-override

# public/ and api/ are merged at the container's web root, matching the
# document-root-dedicated-to-this-app assumption documented in
# public/.htaccess and public/assets/form.js (API_URL).
COPY public/ /var/www/html/
COPY api/ /var/www/html/api/
