<?php
/**
 * Endpoint para abandonar una organización
 *
 * Elimina al usuario de la organización si no es el creador original.
 *
 * @api
 * @method POST
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

$input = json_decode(file_get_contents('php://input'), true);
$organizacion_id = $input['organizacion_id'] ?? null;

if (!$organizacion_id) {
    http_response_code(400);
    echo json_encode(["error" => "El ID de la organización es obligatorio"]);
    exit;
}

try {
    $conexion->beginTransaction();

    // Comprobar si el usuario es el creador
    $stmtCheck = $conexion->prepare("SELECT creado_por FROM organizaciones WHERE id = :id FOR UPDATE");
    $stmtCheck->bindParam(':id', $organizacion_id);
    $stmtCheck->execute();
    $org = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$org) {
        throw new Exception("La organización no existe");
    }

    if ($org['creado_por'] == $userId) {
        throw new Exception("El creador de la organización no puede abandonarla");
    }

    // Comprobar si el usuario pertenece a la org
    $stmtCheckMiembro = $conexion->prepare("SELECT * FROM organizacion_miembros WHERE organizacion_id = :org_id AND usuario_id = :user_id FOR UPDATE");
    $stmtCheckMiembro->bindParam(':org_id', $organizacion_id);
    $stmtCheckMiembro->bindParam(':user_id', $userId);
    $stmtCheckMiembro->execute();

    if ($stmtCheckMiembro->rowCount() === 0) {
        throw new Exception("No perteneces a esta organización");
    }

    // Borrar al usuario de la organización
    $stmtDelete = $conexion->prepare("DELETE FROM organizacion_miembros WHERE organizacion_id = :org_id AND usuario_id = :user_id");
    $stmtDelete->bindParam(':org_id', $organizacion_id);
    $stmtDelete->bindParam(':user_id', $userId);
    $stmtDelete->execute();

    $conexion->commit();

    http_response_code(200);
    echo json_encode(["message" => "Has abandonado la organización con éxito"]);
} catch (Exception $e) {
    $conexion->rollBack();
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
} catch (PDOException $e) {
    $conexion->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Error de base de datos: " . $e->getMessage()]);
}
?>
