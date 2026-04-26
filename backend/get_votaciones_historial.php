<?php
/**
 * get_votaciones_historial.php
 *
 * Endpoint API (GET) para recuperar todas las votaciones FINALIZADAS a
 * las que el usuario actual tiene (o tuvo) derecho a participar.
 * Calcula el total de votos por opción (Global) sin revelar identidades.
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
    // Obtenemos los datos geográficos del usuario para el cruce de Votaciones Gubernamentales
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

    // Obtenemos los IDs de las organizaciones a las que el usuario pertenece
    $stmtGrupos = $conexion->prepare("SELECT organizacion_id FROM organizacion_miembros WHERE usuario_id = ?");
    $stmtGrupos->execute([$userId]);
    $gruposIds = $stmtGrupos->fetchAll(PDO::FETCH_COLUMN); // Devuelve array plano [1, 5, 12]

    // Construimos dinámicamente el fragmento IN() para SQL, o dejarlo en fallback irrealizable si está vacío
    $gruposInstruccion = empty($gruposIds) ? "1=0" : "id_grupo IN (" . implode(',', array_fill(0, count($gruposIds), '?')) . ")";

    // Montamos la consulta maestra de Votaciones Históricas
    // Condiciones: cerrada manualmente o fecha actual mayor a fecha_final
    $sql = "SELECT v.id, v.titulo, v.descripcion, v.tipo, v.alcance, v.fecha_final, v.id_opcion_ganadora, v.razon_cierre, v.cerrada, v.id_grupo, o.nombre as organizacion_nombre 
            FROM votaciones v
            LEFT JOIN organizaciones o ON v.id_grupo = o.id
            WHERE (v.cerrada = 1 
            OR NOW() > v.fecha_final)
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
            ORDER BY v.fecha_final DESC";

    $stmtVotaciones = $conexion->prepare($sql);

    // Mapeamos los parámetros dinámicos para el execute()
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

    // Obtenemos Opciones y el estado 'hasVoted' del usuario
    if (!empty($votaciones)) {
        // Preparamos consultas cacheadas para rendimiento
        $stmtCheckVoto = $conexion->prepare("SELECT id FROM votos_registrados WHERE id_votacion = ? AND id_usuario = ? LIMIT 1");
        $stmtOpciones = $conexion->prepare("
            SELECT id, nombre_opcion, desc_opcion, 
                   (SELECT COUNT(*) FROM votos_anonimos va WHERE va.id_opcion = opciones.id) as total_votos
            FROM opciones 
            WHERE id_votacion = ?
        ");
        
        $stmtUpdateWinner = $conexion->prepare("UPDATE votaciones SET id_opcion_ganadora = ? WHERE id = ?");

        foreach ($votaciones as &$votacion) {
            $vid = $votacion['id'];

            // ¿El usuario ya votó en esta elección?
            $stmtCheckVoto->execute([$vid, $userId]);
            $votacion['hasVoted'] = $stmtCheckVoto->fetch() ? true : false;

            // Conseguimos las candidaturas/opciones
            $stmtOpciones->execute([$vid]);
            $opciones = $stmtOpciones->fetchAll(PDO::FETCH_ASSOC);

            // Calculamos el total de votos para sacar porcentajes y la opción ganadora
            $maxVotos = 0;
            $totalVotosVotacion = 0;
            $ganadorIdActual = $votacion['id_opcion_ganadora'];

            foreach ($opciones as &$opcion) {
                $opcion['total_votos'] = (int)$opcion['total_votos'];
                $totalVotosVotacion += $opcion['total_votos'];

                // Si no hay ganador guardado, buscamos la opción con más votos
                if (is_null($votacion['id_opcion_ganadora'])) {
                    if ($opcion['total_votos'] > $maxVotos) {
                        $maxVotos = $opcion['total_votos'];
                        $ganadorIdActual = $opcion['id'];
                    }
                }
            }

            // Si no teníamos ganador y hemos encontrado uno (es decir, maxVotos > 0), lo guardamos
            if (is_null($votacion['id_opcion_ganadora']) && $ganadorIdActual !== null && $maxVotos > 0) {
                $stmtUpdateWinner->execute([$ganadorIdActual, $vid]);
                $votacion['id_opcion_ganadora'] = $ganadorIdActual;
            }

            // Asignamos ganador y calcular porcentaje para la respuesta limpia al frontend
            foreach ($opciones as &$opcion) {
                $opcion['isWinner'] = (!is_null($votacion['id_opcion_ganadora']) && $opcion['id'] === $votacion['id_opcion_ganadora']);
                $opcion['porcentaje'] = $totalVotosVotacion > 0 ? round(($opcion['total_votos'] / $totalVotosVotacion) * 100) : 0;
            }

            $votacion['opciones'] = $opciones;
            $votacion['total_votos'] = $totalVotosVotacion;
        }
    }

    echo json_encode(["votaciones" => $votaciones]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno en el servidor: " . $e->getMessage()]);
}

$conexion = null;