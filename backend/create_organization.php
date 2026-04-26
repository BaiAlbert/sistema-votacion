<?php

/**
 * Endpoint de Creación de Organizaciones
 *
 * Recibe un payload JSON con los detalles de una nueva organización,
 * genera un código único de 8 caracteres y guarda la organización.
 * Añade al creador como administrador.
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

if (!isset($input['nombre'])) {
    http_response_code(400);
    echo json_encode(["error" => "Falta el nombre de la organización"]);
    exit;
}

$nombre = trim($input['nombre']);
$descripcion = trim($input['descripcion'] ?? '');
$sede_ciudad = trim($input['sede_ciudad'] ?? '');

if (empty($nombre)) {
    http_response_code(400);
    echo json_encode(["error" => "El nombre no puede estar vacío"]);
    exit;
}

// Función para generar código de 8 caracteres alfanuméricos
function generarCodigoUnico($length = 8) {
    $caracteres = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $codigo = '';
    for ($i = 0; $i < $length; $i++) {
        $codigo .= $caracteres[rand(0, strlen($caracteres) - 1)];
    }
    return $codigo;
}

try {
    $conexion->beginTransaction();

    // Generar código y asegurarse de que sea único (por si acaso hay colisión)
    $codigo_unico = generarCodigoUnico();
    $stmt_check = $conexion->prepare("SELECT id FROM organizaciones WHERE codigo_unico = ?");
    
    $max_intentos = 5;
    $intentos = 0;
    while ($intentos < $max_intentos) {
        $stmt_check->execute([$codigo_unico]);
        if ($stmt_check->rowCount() == 0) {
            break;
        }
        $codigo_unico = generarCodigoUnico();
        $intentos++;
    }

    if ($intentos == $max_intentos) {
        throw new Exception("No se pudo generar un código único");
    }

    $sql = "INSERT INTO organizaciones (nombre, descripcion, sede_ciudad, codigo_unico, creado_por) 
            VALUES (?, ?, ?, ?, ?)";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([$nombre, $descripcion, $sede_ciudad, $codigo_unico, $userId]);

    $organizacion_id = $conexion->lastInsertId();

    $sql_miembro = "INSERT INTO organizacion_miembros (organizacion_id, usuario_id, es_admin) VALUES (?, ?, 1)";
    $stmt_miembro = $conexion->prepare($sql_miembro);
    $stmt_miembro->execute([$organizacion_id, $userId]);

    $conexion->commit();

    http_response_code(201);
    echo json_encode([
        "message" => "Organización creada con éxito", 
        "organizacion_id" => $organizacion_id,
        "codigo_unico" => $codigo_unico
    ]);

} catch (PDOException $e) {
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => "Error interno en DB: " . $e->getMessage()]);
} catch (Exception $e) {
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conexion = null;
