<?php

/**
 * Endpoint de Verificación de Sesión (JWT)
 *
 * Verifica el token JWT enviado por el frontend. Si es válido y no ha caducado,
 * consulta la base de datos para obtener los datos más recientes del usuario
 * (incluyendo su rol actual) y los devuelve.
 *
 * @api
 * @method POST
 * @package API
 */

require 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

include_once 'config/db.php';

// Configuración CORS y Preflight (Options) (ya explicado en login.php)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificamos el token
$input = json_decode(file_get_contents('php://input'), true);
$token = $input['token'] ?? null;

if (!$token) {
    http_response_code(401);
    echo json_encode(["error" => "No se proporcionó token de autenticación"]);
    exit;
}

try {
    // Intentamos decodificar el token usando nuestra clave secreta
    // Si el token fue modificado, caducó, o la firma no coincide, lanzaremos una excepción
    $decoded = JWT::decode($token, new Key($jwt_secret, 'HS256'));
    
    $userId = $decoded->data->id;

    // Obtenemos los datos frescos de la base de datos para asegurarnos de que el rol es el actual
    $sql = "SELECT id, dni, username, nombre, apellidos, email, num_telefono, provincia, ciudad, rol FROM usuarios WHERE id = ?";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([$userId]);
    
    if ($user = $stmt->fetch()) {
        echo json_encode([
            "message" => "Token válido",
            "user" => $user
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "El usuario ya no existe en la base de datos"]);
    }

} catch (Exception $e) {
    // Token inválido o expirado
    http_response_code(401);
    echo json_encode(["error" => "Token inválido o sesión expirada"]);
}

$conexion = null;
