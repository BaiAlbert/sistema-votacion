-- Script SQL para el setup inicial del usuario y la BBDD que sera usada por la APP

-- 1. Crear el usuario (Ajusta la contraseña en producción o pásala como variable de entorno)
CREATE USER IF NOT EXISTS 'user_appvotaciones'@'localhost' IDENTIFIED BY '123456';

-- 2. Crear la base de datos
CREATE DATABASE IF NOT EXISTS db_appvotaciones;

-- 3. Conceder privilegios DML (Data Manipulation Language) sobre la base de datos de la aplicación
-- Esto permite a la aplicación leer, insertar, actualizar y borrar datos de tu base de datos.
GRANT SELECT, INSERT, UPDATE, DELETE ON db_appvotaciones.* TO 'user_appvotaciones'@'localhost';

-- 4. Conceder permisos DDL limitados si se requieren (opcional, en general las apps no deberían alterar esquemas)
-- GRANT CREATE, ALTER, DROP ON db_appvotaciones.* TO 'user_appvotaciones'@'localhost';

-- 5. Conceder permisos de lectura sobre el information_schema
-- Esto es crucial ya que el archivo register.php hace esta consulta:
-- SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'
-- Los usuarios en MySQL tienen acceso de solo lectura al information_schema por defecto
-- pero solo pueden ver metadatos de las tablas sobre las que tienen privilegios.
-- Dado que en el paso 2 ya le dimos accesos sobre `db_appvotaciones.*`,
-- la consulta sobre `information_schema.COLUMNS` para la tabla `usuarios` ubicada en `db_appvotaciones` ya funcionará.
-- No obstante, si queremos garantizar el permiso de manera global (no recomendado por mínima política de privilegios):
-- GRANT SELECT ON information_schema.* TO 'user_appvotaciones'@'localhost';

-- 6. Aplicar los privilegios
FLUSH PRIVILEGES;