<?php
/**
 * Endpoint para obtener las organizaciones a las que pertenece el usuario
 *
 * Devuelve un array JSON con los detalles de las organizaciones y el rol del usuario en ellas.
 * Si el usuario es admin, devolverá también el codigo_unico.
 *
 * @api
 * @method GET
 */

// CONFIGURACIÓN CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

// Conexión a base de datos y dependencias
require 'vendor/autoload.php';
include_once 'config/db.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$headers = getallheaders();
$authHeader = $headers['Authorization'] 
           ?? $headers['authorization'] 
           ?? $_SERVER['HTTP_AUTHORIZATION'] 
           ?? '';

if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["error" => "Token ausente o inválido"]);
    exit;
}

$token = $matches[1];
$userId = null;

try {
    $decoded = JWT::decode($token, new Key($jwt_secret, 'HS512'));
    $userId = $decoded->data->id ?? null;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido o expirado"]);
    exit;
}

if (!$userId) {
    http_response_code(403);
    echo json_encode(["error" => "Usuario no identificado"]);
    exit;
}

try {
    $query = "SELECT 
                o.id, 
                o.nombre, 
                o.descripcion, 
                o.sede_ciudad,
                o.creado_por,
                om.es_admin,
                CASE WHEN om.es_admin = 1 THEN o.codigo_unico ELSE NULL END as codigo_unico
              FROM organizaciones o 
              INNER JOIN organizacion_miembros om ON o.id = om.organizacion_id 
              WHERE om.usuario_id = :id_usuario";

    $stmt = $conexion->prepare($query);
    $stmt->bindParam(':id_usuario', $userId);
    $stmt->execute();

    $organizaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(["organizaciones" => $organizaciones]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de base de datos: " . $e->getMessage()]);
}
?>
