<?php

/**
 * Endpoint para Unirse a una Organización
 *
 * Recibe el código de 8 dígitos de la organización y crea una solicitud.
 *
 * @api
 * @method POST
 * @package API
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

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

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['codigo_unico'])) {
    http_response_code(400);
    echo json_encode(["error" => "Falta el código de la organización"]);
    exit;
}

$codigo_unico = trim($input['codigo_unico']);
$pide_ser_admin = isset($input['pide_ser_admin']) && $input['pide_ser_admin'] ? 1 : 0;

try {
    // Buscar la organización
    $stmt_org = $conexion->prepare("SELECT id FROM organizaciones WHERE codigo_unico = ?");
    $stmt_org->execute([$codigo_unico]);
    $organizacion = $stmt_org->fetch(PDO::FETCH_ASSOC);

    if (!$organizacion) {
        http_response_code(404);
        echo json_encode(["error" => "Organización no encontrada con ese código"]);
        exit;
    }

    $organizacion_id = $organizacion['id'];

    // Comprobar si ya es miembro
    $stmt_miembro = $conexion->prepare("SELECT 1 FROM organizacion_miembros WHERE organizacion_id = ? AND usuario_id = ?");
    $stmt_miembro->execute([$organizacion_id, $userId]);
    if ($stmt_miembro->fetchColumn()) {
        http_response_code(400);
        echo json_encode(["error" => "Ya eres miembro de esta organización"]);
        exit;
    }

    // Comprobar si ya tiene una solicitud pendiente
    $stmt_solicitud = $conexion->prepare("SELECT 1 FROM organizacion_solicitudes WHERE organizacion_id = ? AND usuario_id = ? AND estado = 'pendiente'");
    $stmt_solicitud->execute([$organizacion_id, $userId]);
    if ($stmt_solicitud->fetchColumn()) {
        http_response_code(400);
        echo json_encode(["error" => "Ya tienes una solicitud pendiente para esta organización"]);
        exit;
    }

    // Crear la solicitud
    $sql = "INSERT INTO organizacion_solicitudes (organizacion_id, usuario_id, pide_ser_admin, estado) VALUES (?, ?, ?, 'pendiente')";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([$organizacion_id, $userId, $pide_ser_admin]);

    http_response_code(201);
    echo json_encode(["message" => "Solicitud enviada correctamente"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno en DB: " . $e->getMessage()]);
}

$conexion = null;
