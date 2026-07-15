FROM php:8.4-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libssl-dev \
    pkg-config \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && apt-get purge -y --auto-remove pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
