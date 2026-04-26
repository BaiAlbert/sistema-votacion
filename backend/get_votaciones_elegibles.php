<?php

/**
 * Endpoint de Votaciones Elegibles
 *
 * Devuelve todas las votaciones activas (no caducadas y no cerradas) en las que el 
 * usuario actual es elegible para participar (basado en su provincia, ciudad o grupos).
 * También indica si el usuario ya ha votado o no en cada una de ellas cruzando datos
 * con el censo de `votos_registrados`.
 *
 * @api
 * @method GET
 * @package API
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
    echo json_encode(["error" => "Token expirado o corrupto"]);
    exit;
}

try {
    // 1. Obtener los datos geográficos del usuario para el cruce de Votaciones Gubernamentales
    $stmtUser = $conexion->prepare("SELECT provincia, ciudad FROM usuarios WHERE id = ?");
    $stmtUser->execute([$userId]);
    $userGeo = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$userGeo) {
        http_response_code(404);
        echo json_encode(["error" => "Usuario no encontrado en la base de datos"]);
        exit;
    }

    $provinciaUser = $userGeo['provincia'];
    $ciudadUser = $userGeo['ciudad'];

    // 2. Obtener los IDs y permisos de las organizaciones a las que el usuario pertenece
    $stmtGrupos = $conexion->prepare("SELECT organizacion_id, es_admin FROM organizacion_miembros WHERE usuario_id = ?");
    $stmtGrupos->execute([$userId]);
    $userGrupos = $stmtGrupos->fetchAll(PDO::FETCH_ASSOC); 
    
    $gruposIds = [];
    $adminMap = []; // organizacion_id => es_admin boolean
    foreach ($userGrupos as $g) {
        $gruposIds[] = $g['organizacion_id'];
        $adminMap[$g['organizacion_id']] = $g['es_admin'] == 1;
    }

    // Construir dinámicamente el fragmento IN() para SQL, o dejarlo en fallback irrealizable si está vacío
    $gruposInstruccion = empty($gruposIds) ? "1=0" : "id_grupo IN (" . implode(',', array_fill(0, count($gruposIds), '?')) . ")";

    // 3. Montar la consulta maestra de Votaciones Elegibles
    // Condiciones universales: fecha actual menor o igual a fecha_final y no cerrada manualmente.
    // Opcionalmente, exigimos que ya hayan empezado (NOW >= fecha_inicio).
    $sql = "SELECT v.id, v.titulo, v.descripcion, v.tipo, v.alcance, v.fecha_final, v.id_grupo, o.nombre as organizacion_nombre 
            FROM votaciones v
            LEFT JOIN organizaciones o ON v.id_grupo = o.id
            WHERE v.cerrada = 0 
            AND NOW() BETWEEN v.fecha_inicio AND v.fecha_final
            AND (
                -- Caso 1: Votación Gubernamental Nacional
                (v.tipo = 'gubernamental' AND v.alcance = 'nacional')
                
                -- Caso 2: Votación Gubernamental Provincial (coincide provincia)
                OR (v.tipo = 'gubernamental' AND v.alcance = 'provincial' AND v.provincia_target = ?)
                
                -- Caso 3: Votación Gubernamental Local (coincide provincia y ciudad)
                OR (v.tipo = 'gubernamental' AND v.alcance = 'local' AND v.provincia_target = ? AND v.ciudad_target = ?)
                
                -- Caso 4: Votación Privada (ID de grupo coincide con los aprobados del usuario)
                OR (v.tipo = 'privada' AND v.$gruposInstruccion)
            )
            ORDER BY v.fecha_final ASC";

    $stmtVotaciones = $conexion->prepare($sql);

    // Mapear los parámetros dinámicos para el execute()
    $params = [
        $provinciaUser, // Para Caso 2
        $provinciaUser, // Para Caso 3
        $ciudadUser     // Para Caso 3
    ];
    // Añadimos los placeholders de Grupo para el Caso 4
    if (!empty($gruposIds)) {
        $params = array_merge($params, $gruposIds);
    }

    $stmtVotaciones->execute($params);
    $votaciones = $stmtVotaciones->fetchAll(PDO::FETCH_ASSOC);

    // 4. Enriquecer las Votaciones (Obtener Opciones y el estado 'hasVoted' del usuario)
    if (!empty($votaciones)) {
        // Preparar consultas cacheadas para rendimiento
        $stmtCheckVoto = $conexion->prepare("SELECT id FROM votos_registrados WHERE id_votacion = ? AND id_usuario = ? LIMIT 1");
        $stmtOpciones = $conexion->prepare("SELECT id, nombre_opcion, desc_opcion FROM opciones WHERE id_votacion = ?");

        foreach ($votaciones as &$votacion) {
            $vid = $votacion['id'];

            // ¿El usuario ya votó en esta elección?
            $stmtCheckVoto->execute([$vid, $userId]);
            $votacion['hasVoted'] = $stmtCheckVoto->fetch() ? true : false;

            // ¿Es administrador de la organización?
            $votacion['es_admin_org'] = false;
            if ($votacion['tipo'] === 'privada' && isset($votacion['id_grupo'])) {
                $votacion['es_admin_org'] = $adminMap[$votacion['id_grupo']] ?? false;
            }

            // Conseguir las candidaturas/opciones
            $stmtOpciones->execute([$vid]);
            $votacion['opciones'] = $stmtOpciones->fetchAll(PDO::FETCH_ASSOC);
        }
    }

    echo json_encode(["votaciones" => $votaciones]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno en el servidor: " . $e->getMessage()]);
}

$conexion = null;
