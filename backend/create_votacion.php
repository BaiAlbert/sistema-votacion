<?php

/**
 * Endpoint de Creación de Votaciones
 *
 * Recibe un payload JSON con los detalles de una nueva votación y la inserta
 * en la base de datos tras verificar la identidad y permisos del usuario mediante JWT.
 * 
 * Soporta parametrizaciones condicionales para votaciones gubernamentales (alcance, ciudad, provincia)
 * y privadas (id_grupo).
 *
 * @api
 * @method POST
 * @package API
 */

// CONFIGURACIÓN CORS (Debe ir lo primerísimo)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// CONEXIÓN A BASE DE DATOS Y DEPENDENCIAS
require 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

include_once 'config/db.php';
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["error" => "Token de formato inválido o ausente"]);
    exit;
}

$token = $matches[1];
$userId = null;
$userRole = null;

try {
    $decoded = JWT::decode($token, new Key($jwt_secret, 'HS512'));
    $userId = $decoded->data->id ?? null;
    $userRole = $decoded->data->rol ?? null;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido o expirado"]);
    exit;
}

// 2. Verificar Permisos
// Un filtro rápido para expulsar a cualquiera que intente acceder al script de creación
// sin tener el rol adecuado en su Token validado.
if ($userRole !== 'admin_privado' && $userRole !== 'admin_gobierno') {
    http_response_code(403);
    echo json_encode(["error" => "No tienes permisos para crear votaciones"]);
    exit;
}

// 3. Procesar el Payload JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['titulo'], $input['tipo'], $input['fecha_inicio'], $input['fecha_final'], $input['opciones'])) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan campos obligatorios base, incluyendo las opciones"]);
    exit;
}

$titulo = trim($input['titulo']);
$descripcion = trim($input['descripcion'] ?? '');
$tipo = $input['tipo'];
$fecha_inicio = $input['fecha_inicio'];
$fecha_final = $input['fecha_final'];
$opciones = $input['opciones'];

// Validación de Opciones
if (!is_array($opciones) || count($opciones) < 2) {
    http_response_code(400);
    echo json_encode(["error" => "Se requieren al menos 2 opciones de votación."]);
    exit;
}

foreach ($opciones as $index => $opcion) {
    if (empty(trim($opcion['nombre_opcion']))) {
        http_response_code(400);
        echo json_encode(["error" => "El nombre de la opción " . ($index + 1) . " no puede estar vacío."]);
        exit;
    }
}

// Variables condicionales
$alcance = null;
$provincia_target = null;
$ciudad_target = null;
$id_grupo = null;

// Validación Estricta Gubernamental
if ($tipo === 'gubernamental') {
    if ($userRole !== 'admin_gobierno') {
        http_response_code(403);
        echo json_encode(["error" => "Un admin privado no puede crear votaciones gubernamentales"]);
        exit;
    }

    $alcance = $input['alcance'] ?? null;
    if (!$alcance) {
        http_response_code(400);
        echo json_encode(["error" => "Debe especificar el alcance para una votación gubernamental"]);
        exit;
    }

    if ($alcance === 'provincial') {
        $provincia_target = trim($input['provincia_target'] ?? '');
        if (empty($provincia_target)) {
            http_response_code(400);
            echo json_encode(["error" => "Falta especificar la provincia_target"]);
            exit;
        }
    } elseif ($alcance === 'local') {
        $provincia_target = trim($input['provincia_target'] ?? '');
        $ciudad_target = trim($input['ciudad_target'] ?? '');
        if (empty($provincia_target) || empty($ciudad_target)) {
            http_response_code(400);
            echo json_encode(["error" => "Falta especificar la provincia o ciudad target para una elección local"]);
            exit;
        }
    }
}

// Validación Estricta Privada
if ($tipo === 'privada') {
    $id_grupo = $input['id_grupo'] ?? null;
    if (empty($id_grupo)) {
        http_response_code(400);
        echo json_encode(["error" => "Falta especificar el id_grupo para una votación privada"]);
        exit;
    }

    // Opcional: Podríamos verificar si el usuario es realmente admin_privado DE ESE GRUPO EN CONCRETO
    // consultando la tabla usuarios_grupos. Lo implementamos por seguridad extra 
    // para evitar que un admin intercepte el frontend enviando un ID de grupo ajeno.
    $checkGrupoStmt = $conexion->prepare("SELECT rol_grupo FROM usuarios_grupos WHERE id_usuario = ? AND id_grupo = ? AND estado = 'aprobado'");
    $checkGrupoStmt->execute([$userId, $id_grupo]);
    $userGroupRel = $checkGrupoStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userGroupRel || $userGroupRel['rol_grupo'] !== 'admin_privado') {
        http_response_code(403);
        echo json_encode(["error" => "No tienes permisos de administrador en este grupo específico"]);
        exit;
    }
}

// 4. Inserción en Base de Datos empleando Transacciones Atómicas (PDO Transactions)
try {
    // Iniciamos la transacción: A partir de este momento, cualquier INSERT/UPDATE/DELETE 
    // quedará en un limbo temporal. Si algo falla a medias, MySQL cancelará todo el proceso
    // como si nunca hubiera ocurrido. Esto evita tener Votaciones sin Opciones si se cae el servidor a medio camino.
    $conexion->beginTransaction();

    $sql = "INSERT INTO votaciones 
            (id_autor, titulo, descripcion, tipo, alcance, provincia_target, ciudad_target, id_grupo, fecha_inicio, fecha_final) 
            VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        $userId, 
        $titulo, 
        $descripcion, 
        $tipo, 
        $alcance, 
        $provincia_target, 
        $ciudad_target, 
        $id_grupo, 
        $fecha_inicio, 
        $fecha_final
    ]);

    // Obtenemos el ID de la votación recién creada
    $votacion_id = $conexion->lastInsertId();

    // Insertamos las opciones vinculadas a esta votación
    $sql_opcion = "INSERT INTO opciones (id_votacion, nombre_opcion, desc_opcion) VALUES (?, ?, ?)";
    $stmt_opcion = $conexion->prepare($sql_opcion);

    foreach ($opciones as $opcion) {
        $stmt_opcion->execute([
            $votacion_id,
            trim($opcion['nombre_opcion']),
            trim($opcion['desc_opcion'] ?? '')
        ]);
    }

    // Si hemos llegado vivos hasta aquí, significa que tanto la Votación Principal
    // como sus N Opciones secundarias se han guardado en el limbo correctamente.
    // Damos la orden final a MySQL para que aplique los cambios de verdad (commit).
    $conexion->commit();

    http_response_code(201);
    echo json_encode([
        "message" => "Votación y opciones creadas con éxito", 
        "votacion_id" => $votacion_id
    ]);

} catch (PDOException $e) {
    // Si cualquier "INSERT" falló o hubo un error de tipo en los arrays
    // MySQL entra en modo pánico. Le decimos que revierta ("rollBack") 
    // todo lo que hizo desde `beginTransaction` y nos devuelva al inicio limpio.
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => "Error interno al guardar los datos: " . $e->getMessage()]);
}

$conexion = null;
