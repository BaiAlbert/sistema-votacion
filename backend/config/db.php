<?php

/**
* Configuración de la conexión a la Base de Datos
*
* Este script crea y establece una conexión a la base de datos MySQL utilizando PDO.
* Carga las variables de entorno mediante un archivo .env y gestiona los errores de conexión
* devolviendo una respuesta de error en formato JSON.
*
* @package Config
*/

require 'vendor/autoload.php';

// Cargamos las variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$host = $_ENV['DB_HOST'];
$db = $_ENV['DB_NAME'];
$user = $_ENV['DB_USER'];
$pass = file_exists('/run/secrets/db_password') ? trim(file_get_contents('/run/secrets/db_password')) : $_ENV['DB_PASSWORD'];
$jwt_secret = file_exists('/run/secrets/jwt_secret') ? trim(file_get_contents('/run/secrets/jwt_secret')) : $_ENV['JWT_SECRET'];
$dni_pepper = file_exists('/run/secrets/dni_pepper') ? trim(file_get_contents('/run/secrets/dni_pepper')) : $_ENV['DNI_PEPPER'];

// Creamos la conexión usando PDO
try {
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $opciones = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $conexion = new PDO($dsn, $user, $pass, $opciones);
} catch (PDOException $e) {
    // Establecemos código 500 para que el frontend (fetch) sepa que response.ok es falso
    http_response_code(500);
    // Devolvemos JSON con el error y matamos el proceso para que no siga
    die(json_encode(["error" => "Error de conexión: " . $e->getMessage()]));
}
