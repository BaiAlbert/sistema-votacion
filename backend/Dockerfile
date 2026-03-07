FROM php:8.2-apache

# Enable apache rewrite module
RUN a2enmod rewrite

# Install required PHP extensions for MySQL connection
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Note: The codebase includes composer usage ("require vendor/autoload.php").
# Assuming composer install has already been run locally during dev, 
# or if not, you should add composer installation here.
# Since volume mapping is used, the local 'vendor' folder is shared with the container.
