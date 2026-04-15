# Partimos de tu imagen base
FROM php:8.5-apache

# Habilitar mod_rewrite de Apache
RUN a2enmod rewrite

# Instalar extensiones PDO y MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Instalar Git y Unzip (necesarios para que Composer funcione bien)
RUN apt-get update && apt-get install -y git unzip

# Instalar Composer dentro de la imagen
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establecer el directorio de trabajo
WORKDIR /var/www/html

# Copiar todo el código del backend al contenedor
COPY . .

# Instalar dependencias de PHP para producción
RUN composer install --no-dev --optimize-autoloader

# Dar permisos al usuario de Apache
RUN chown -R www-data:www-data /var/www/html