<?php

/**
 * Configuración de la conexión a la Base de Datos
 *
 * Este script crea y establece una conexión a la base de datos MySQL utilizando MySQLi.
 * Carga las variables de entorno mediante un archivo .env y gestiona los errores de conexión
 * devolviendo una respuesta de error en formato JSON.
 *
 * @package Config
 */
require 'vendor/autoload.php';

// Cargamos las variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$host = $_ENV['DB_HOST'] ?? 'localhost';
$db   = $_ENV['DB_NAME'] ?? 'app_votaciones';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';

// Creamos la conexión usando MySQLi
$conexion = new mysqli($host, $user, $pass, $db);

// Verificamos si murió la conexión
if ($conexion->connect_error) {
    // Devolvemos JSON con el error y matamos el proceso para que no siga
    die(json_encode(["error" => "Error de conexión: " . $conexion->connect_error]));
}

// Configuramos el charset
$conexion->set_charset("utf8mb4");