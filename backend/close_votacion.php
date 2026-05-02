<?php
/**
 * Endpoint para cerrar una votación anticipadamente
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
$id_votacion = $input['id_votacion'] ?? null;
$razon_cierre = $input['razon_cierre'] ?? '';

if (!$id_votacion) {
    http_response_code(400);
    echo json_encode(["error" => "El ID de la votación es obligatorio"]);
    exit;
}

if (empty(trim($razon_cierre))) {
    http_response_code(400);
    echo json_encode(["error" => "La razón de cierre es obligatoria"]);
    exit;
}

try {
    $conexion->beginTransaction();

    // 1. Obtener la votación
    $stmtVotacion = $conexion->prepare("SELECT id_grupo, tipo, cerrada FROM votaciones WHERE id = ? FOR UPDATE");
    $stmtVotacion->execute([$id_votacion]);
    $votacion = $stmtVotacion->fetch(PDO::FETCH_ASSOC);

    if (!$votacion) {
        throw new Exception("La votación no existe");
    }

    if ($votacion['cerrada'] == 1) {
        throw new Exception("Esta votación ya está cerrada");
    }

    if ($votacion['tipo'] !== 'privada') {
        throw new Exception("Solo se pueden cerrar manualmente las votaciones privadas");
    }

    // 2. Verificar que el usuario es admin de ese grupo
    $stmtAdmin = $conexion->prepare("SELECT es_admin FROM organizacion_miembros WHERE organizacion_id = ? AND usuario_id = ?");
    $stmtAdmin->execute([$votacion['id_grupo'], $userId]);
    $membresia = $stmtAdmin->fetch(PDO::FETCH_ASSOC);

    if (!$membresia || $membresia['es_admin'] != 1) {
        throw new Exception("No tienes permisos de administrador en esta organización");
    }

    // 3. Cerrar la votación
    $stmtClose = $conexion->prepare("UPDATE votaciones SET cerrada = 1, razon_cierre = ? WHERE id = ?");
    $stmtClose->execute([$razon_cierre, $id_votacion]);

    // 4 Auditar la votación en el momento que la cerramos
    require_once 'service_integridad.php';
    IntegridadService::auditar($id_votacion, $conexion, $jwt_secret);

    // 5. Calcular el ganador (opcional pero recomendable al cerrar)
    // Contar los votos por opción
    $stmtCount = $conexion->prepare("
        SELECT id_opcion, COUNT(*) as total 
        FROM votos_anonimos 
        WHERE id_votacion = ? 
        GROUP BY id_opcion 
        ORDER BY total DESC 
        LIMIT 1
    ");
    $stmtCount->execute([$id_votacion]);
    $ganador = $stmtCount->fetch(PDO::FETCH_ASSOC);

    if ($ganador) {
        $stmtUpdateWinner = $conexion->prepare("UPDATE votaciones SET id_opcion_ganadora = ? WHERE id = ?");
        $stmtUpdateWinner->execute([$ganador['id_opcion'], $id_votacion]);
    }

    $conexion->commit();

    http_response_code(200);
    echo json_encode(["message" => "Votación cerrada con éxito"]);
} catch (Exception $e) {
    $conexion->rollBack();
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
} catch (PDOException $e) {
    $conexion->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Error de BBDD: " . $e->getMessage()]);
}
?>
