<?php

/**
 * Endpoint para Gestionar Solicitudes de Organización
 *
 * GET: Lista solicitudes pendientes para organizaciones donde el usuario es admin.
 * PUT/POST: Acepta o deniega una solicitud.
 *
 * @api
 * @method GET, POST
 * @package API
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Listar solicitudes
    try {
        $sql = "SELECT 
                    os.id AS solicitud_id,
                    o.nombre AS organizacion_nombre,
                    u.nombre,
                    u.apellidos,
                    u.provincia,
                    u.ciudad,
                    os.pide_ser_admin,
                    os.fecha_solicitud
                FROM organizacion_solicitudes os
                JOIN organizaciones o ON os.organizacion_id = o.id
                JOIN usuarios u ON os.usuario_id = u.id
                JOIN organizacion_miembros om ON o.id = om.organizacion_id
                WHERE om.usuario_id = ? AND om.es_admin = 1 AND os.estado = 'pendiente'";
        
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$userId]);
        $solicitudes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($solicitudes);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Error interno en DB: " . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Procesar (Aceptar/Denegar)
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['solicitud_id']) || !isset($input['accion'])) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan parámetros (solicitud_id, accion)"]);
        exit;
    }

    $solicitud_id = $input['solicitud_id'];
    $accion = $input['accion']; // 'aceptar' o 'denegar'

    if ($accion !== 'aceptar' && $accion !== 'denegar') {
        http_response_code(400);
        echo json_encode(["error" => "Acción inválida"]);
        exit;
    }

    try {
        $conexion->beginTransaction();

        // Verificar que la solicitud existe, está pendiente y el usuario es admin de esa organización
        $sql_check = "SELECT os.* 
                      FROM organizacion_solicitudes os
                      JOIN organizacion_miembros om ON os.organizacion_id = om.organizacion_id
                      WHERE os.id = ? AND om.usuario_id = ? AND om.es_admin = 1 AND os.estado = 'pendiente'";
        $stmt_check = $conexion->prepare($sql_check);
        $stmt_check->execute([$solicitud_id, $userId]);
        $solicitud = $stmt_check->fetch(PDO::FETCH_ASSOC);

        if (!$solicitud) {
            $conexion->rollBack();
            http_response_code(404);
            echo json_encode(["error" => "Solicitud no encontrada o no tienes permisos"]);
            exit;
        }

        if ($accion === 'aceptar') {
            // Cambiar estado a aceptada
            $stmt_update = $conexion->prepare("UPDATE organizacion_solicitudes SET estado = 'aceptada' WHERE id = ?");
            $stmt_update->execute([$solicitud_id]);

            // Insertar en organizacion_miembros
            $stmt_insert = $conexion->prepare("INSERT INTO organizacion_miembros (organizacion_id, usuario_id, es_admin) VALUES (?, ?, ?)");
            $stmt_insert->execute([$solicitud['organizacion_id'], $solicitud['usuario_id'], $solicitud['pide_ser_admin']]);
            
            $mensaje = "Solicitud aceptada";
        } else {
            // Cambiar estado a denegada
            $stmt_update = $conexion->prepare("UPDATE organizacion_solicitudes SET estado = 'denegada' WHERE id = ?");
            $stmt_update->execute([$solicitud_id]);

            $mensaje = "Solicitud denegada";
        }

        $conexion->commit();
        echo json_encode(["message" => $mensaje]);

    } catch (PDOException $e) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        http_response_code(500);
        echo json_encode(["error" => "Error interno en DB: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
}

$conexion = null;
