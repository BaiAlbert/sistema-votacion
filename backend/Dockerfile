# Paso 1: Construcción de dependencias
FROM composer:latest AS vendor
WORKDIR /app

# 1. Copiamos solo los archivos de Composer primero.
# Docker guardará en caché las dependencias descargadas 
# a menos que se modifique el composer.json o composer.lock.
COPY composer.json composer.lock ./

# 2. Instalamos sin dependencias de desarrollo y optimizamos.
# Usamos --ignore-platform-reqs para que Composer no se queje de que 
# faltan extensiones de base de datos en esta etapa temporal.
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --ignore-platform-reqs

# Paso 2: Imagen de Producción (La que se despliega)
FROM php:8.5-apache

# Habilitamos mod_rewrite de Apache
RUN a2enmod rewrite

# 3. Instalamos extensiones y limpiamos la caché de apt en el mismo RUN.
# Al borrar /var/lib/apt/lists/* reducimos el peso de la imagen base.
RUN apt-get update && \
    docker-php-ext-install pdo pdo_mysql mysqli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Establecemos el directorio de trabajo
WORKDIR /var/www/html

# 4. Copiamos el código de la aplicación
COPY . .

# 5. Copiamos SOLO la carpeta 'vendor' ya generada en el paso 1.
# Nos olvidamos de Git, Unzip y el ejecutable de Composer.
COPY --from=vendor /app/vendor/ ./vendor/

# Damos permisos al usuario de Apache
RUN chown -R www-data:www-data /var/www/html