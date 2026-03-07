<?php

/**
 * Endpoint de Votación
 *
 * Recibe la intención de voto de un usuario (`id_votacion`, `id_opcion`, `firma_nombre`).
 * Valida que la firma concuerde exactamente con su nombre y apellidos en la DB.
 * Ejecuta una Transacción PDO que:
 * 1. Registra su participación en `votos_registrados` para evitar doble voto.
 * 2. Emite la papeleta anónima en `votos_anonimos` cifrada con un hash temporal.
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

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id_votacion'], $input['id_opcion'], $input['firma_nombre'])) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan campos obligatorios para emitir el voto (id_votacion, id_opcion, firma_nombre)"]);
    exit;
}

$id_votacion = (int)$input['id_votacion'];
$id_opcion = (int)$input['id_opcion'];
$firma_nombre = trim(mb_strtolower($input['firma_nombre'], 'UTF-8'));

try {
    // 1. Validar la Firma (Nombre + Apellidos)
    // Obtenemos el nombre y apellidos reales del usuario
    $stmtUser = $conexion->prepare("SELECT nombre, apellidos FROM usuarios WHERE id = ?");
    $stmtUser->execute([$userId]);
    $userRow = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$userRow) {
        http_response_code(404);
        echo json_encode(["error" => "Usuario no encontrado"]);
        exit;
    }

    $nombreCompletoDB = trim(mb_strtolower($userRow['nombre'] . ' ' . $userRow['apellidos'], 'UTF-8'));

    // Eliminamos espacios dobles accidentales tanto en DB como en la firma para que la comparación sea justa
    $firma_nombre = preg_replace('/\s+/', ' ', $firma_nombre);
    $nombreCompletoDB = preg_replace('/\s+/', ' ', $nombreCompletoDB);

    if ($firma_nombre !== $nombreCompletoDB) {
        http_response_code(403);
        echo json_encode(["error" => "La firma no coincide con tu nombre legal registrado. Has intentado firmar como '$firma_nombre' pero te llamas '$nombreCompletoDB'."]);
        exit;
    }

    // 2. Verificar que la opción elegida pertenece realmente a la votación en curso
    $stmtOp = $conexion->prepare("SELECT id FROM opciones WHERE id = ? AND id_votacion = ?");
    $stmtOp->execute([$id_opcion, $id_votacion]);
    if (!$stmtOp->fetch()) {
        http_response_code(400);
        echo json_encode(["error" => "La opción seleccionada no pertenece a esta votación o ha sido manipulada."]);
        exit;
    }

    // 3. Comenzar la Transacción (Todo o Nada)
    $conexion->beginTransaction();

    // 3.1 Insertar el registro de participación ("Censo")
    // Si el usuario ya votó, el UNIQUE(`id_votacion`, `id_usuario`) lanzará un PDOException atrapado abajo.
    $stmtCenso = $conexion->prepare("INSERT INTO votos_registrados (id_votacion, id_usuario) VALUES (?, ?)");
    $stmtCenso->execute([$id_votacion, $userId]);

    // 3.2 Crear una firma criptográfica única representativa de la inserción de esta papeleta.
    // Usamos uniqid mixto para dar una ilusión de blockchain simple a modo de firma digital secreta.
    $hashIntegridad = password_hash(uniqid("voto_$id_votacion", true), PASSWORD_BCRYPT);

    // 3.3 Insertar el voto físico anónimo ("Urna")
    $stmtUrna = $conexion->prepare("INSERT INTO votos_anonimos (id_votacion, id_opcion, hash_integridad) VALUES (?, ?, ?)");
    $stmtUrna->execute([$id_votacion, $id_opcion, $hashIntegridad]);

    // 4. Confirmar que ambas cosas se guardaron correctamente
    $conexion->commit();

    http_response_code(201);
    echo json_encode(["message" => "Voto registrado exitosamente."]);
} catch (PDOException $e) {
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }

    // El error 23000 denota un fallo de Constraint (Violación del Unique Key)
    if ($e->getCode() === '23000') {
        http_response_code(409); // Conflict
        echo json_encode(["error" => "Violación de integridad: Ya has registrado tu participación en esta votación previamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error interno durante la emisión del voto: " . $e->getMessage()]);
    }
}

$conexion = null;
