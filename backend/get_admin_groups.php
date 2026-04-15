<?php
/**
 * Endpoint para obtener los Votaciones de un Admin Privado
 *
 * Devuelve un array JSON con los IDs y los Nombres de las organizaciones/grupos
 * en los que el usuario logueado actualmente figura como 'admin_privado'.
 *
 * @api
 * @method GET
 */

// CONFIGURACIÓN CORS (Debe ir lo primerísimo)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// CONEXIÓN A BASE DE DATOS Y DEPENDENCIAS
require_once 'config/db.php';
require_once 'vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$jwt_secret = $_ENV['JWT_SECRET'];

// Extraemos el encabezado "Authorization" que el frontend de React envía 
$headers = apache_request_headers();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

// Si no nos mandan nada, echamos fuera al atacante/visitante
if (!$authHeader) {
    http_response_code(401);
    echo json_encode(["error" => "Token no proporcionado"]);
    exit;
}

// Limpiamos la palabra 'Bearer ' para quedarnos exclusivamente con el churro de texto del Token
$token = str_replace('Bearer ', '', $authHeader);

try {
    // Verificamos si la firma criptográfica es auténtica usando el token $jwt_secret
    $decoded = JWT::decode($token, new Key($jwt_secret, 'HS512'));
    $userId = $decoded->data->id ?? null; // Sacamos el ID oculto dentro del Token
    $userRole = $decoded->data->rol ?? null; // Sacamos el Rol ocultado dentro del Token
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "Token inválido o expirado"]);
    exit;
}

// Medida Defensiva: Solo los administradores privados pueden llegar hasta aquí.
if (!$userId || $userRole !== 'admin_privado') {
    http_response_code(403);
    echo json_encode(["error" => "No tienes permisos para realizar esta acción"]);
    exit;
}

try {
    // Preparamos una consulta "INNER JOIN" masiva:
    // "Junta la tabla de Grupos (G) con la tabla de Usuarios_Grupos (UG)
    // donde ambas compartan el ID del Grupo. Luego fíltralo TODO para mostrarme solamente
    // aquellas filas donde el ID de usuario coincida con la persona logueada (:id_usuario),
    // tenga el cargo de 'admin_privado', y no esté pendiente o rechazado ('aprobado')."
    $query = "SELECT g.id, g.nombre 
              FROM grupos g 
              INNER JOIN usuarios_grupos ug ON g.id = ug.id_grupo 
              WHERE ug.id_usuario = :id_usuario 
              AND ug.rol_grupo = 'admin_privado' 
              AND ug.estado = 'aprobado'";

    $stmt = $conexion->prepare($query);
    // Bind Param vincula la variable a la consulta MySQL de forma segura para evadir hacking (Inyección SQL)
    $stmt->bindParam(':id_usuario', $userId);
    $stmt->execute();

    // Volcamos todas las filas en un gran array asociativo en PHP
    $grupos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(["grupos" => $grupos]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de base de datos: " . $e->getMessage()]);
}
?>
