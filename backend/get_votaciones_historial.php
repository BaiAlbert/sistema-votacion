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
    exit(0);
}

require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

include_once 'config/db.php';

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["error" => "Token ausente o inválido"]);
    exit;
}

$token = $matches[1];
$userId = null;

try {
    $decoded = JWT::decode($token, new Key($jwt_secret, 'HS256'));
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

    // Obtenemos los IDs de los grupos privados a los que el usuario pertenece y está aprobado
    $stmtGrupos = $conexion->prepare("SELECT id_grupo FROM usuarios_grupos WHERE id_usuario = ? AND estado = 'aprobado'");
    $stmtGrupos->execute([$userId]);
    $gruposIds = $stmtGrupos->fetchAll(PDO::FETCH_COLUMN); // Devuelve array plano [1, 5, 12]

    // Construimos dinámicamente el fragmento IN() para SQL, o dejarlo en fallback irrealizable si está vacío
    $gruposInstruccion = empty($gruposIds) ? "1=0" : "id_grupo IN (" . implode(',', array_fill(0, count($gruposIds), '?')) . ")";

    // Montamos la consulta maestra de Votaciones Elegibles
    // Condiciones: cerrada manualmente o fecha actual mayor a fecha_final
    $sql = "SELECT id, titulo, descripcion, tipo, alcance, fecha_final 
            FROM votaciones 
            WHERE (cerrada = 1 
            OR NOW() > fecha_final)
            AND (
                -- Caso 1: Votación Gubernamental Nacional
                (tipo = 'gubernamental' AND alcance = 'nacional')
                
                -- Caso 2: Votación Gubernamental Provincial (coincide provincia)
                OR (tipo = 'gubernamental' AND alcance = 'provincial' AND provincia_target = ?)
                
                -- Caso 3: Votación Gubernamental Local (coincide provincia y ciudad)
                OR (tipo = 'gubernamental' AND alcance = 'local' AND provincia_target = ? AND ciudad_target = ?)
                
                -- Caso 4: Votación Privada (ID de grupo coincide con los aprobados del usuario)
                OR (tipo = 'privada' AND $gruposInstruccion)
            )
            ORDER BY fecha_final ASC";

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

            foreach ($opciones as &$opcion) {
                $opcion['total_votos'] = (int)$opcion['total_votos'];
                $totalVotosVotacion += $opcion['total_votos'];

                if ($opcion['total_votos'] > $maxVotos) {
                    $maxVotos = $opcion['total_votos'];
                }
            }

            // Asignamos ganador y calcular porcentaje
            foreach ($opciones as &$opcion) {
                $opcion['isWinner'] = ($maxVotos > 0 && $opcion['total_votos'] === $maxVotos);
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