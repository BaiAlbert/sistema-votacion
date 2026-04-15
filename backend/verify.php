<?php

/**
 * Endpoint de Verificación de Sesión (JWT)
 *
 * Verifica el token JWT enviado por el frontend. Si es válido y no ha caducado,
 * consulta la base de datos para obtener los datos más recientes del usuario
 * (incluyendo su rol actual) y los devuelve.
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

// Verificamos el token
$input = json_decode(file_get_contents('php://input'), true);
$token = $input['token'] ?? null;

if (!$token) {
    http_response_code(401);
    echo json_encode(["error" => "No se proporcionó token de autenticación"]);
    exit;
}

try {
    // Intentamos decodificar el token usando nuestra clave secreta del servidor ($jwt_secret)
    // El objeto Key asume que el token se generó con el algoritmo HS512.
    // IMPORTANTE: Si un hacker altera un solo carácter del token desde el DevTools del navegador,
    // la firma criptográfica se romperá y la función decode() saltará al bloque "catch" de abajo.
    // También saltará al catch si ha pasado más del tiempo de vida (expirationTime) que configuramos en login.php.
    $decoded = JWT::decode($token, new Key($jwt_secret, 'HS512'));
    
    // Si llegamos hasta aquí, el token es 100% auténtico y podemos confiar en la ID que lleva dentro.
    $userId = $decoded->data->id;

    // Obtenemos los datos "frescos" de la base de datos (nombre, rol, dni, etc.).
    // Esto es vital: aunque el token diga que es admin_privado, si le quitamos ese rol 
    // en la base de datos mientras tenía sesión iniciada, al consultar esto forzamos 
    // que el Frontend reciba su nuevo rol real y le cierre los menús de administrador.
    $sql = "SELECT id, dni, username, nombre, apellidos, email, num_telefono, provincia, ciudad, rol FROM usuarios WHERE id = ?";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([$userId]);
    
    if ($user = $stmt->fetch()) {
        // Envíamos los datos limpios y empaquetados de vuelta al cliente
        echo json_encode([
            "message" => "Token válido",
            "user" => $user
        ]);
    } else {
        // El token era de un ID válido criptográficamente, pero ya no existe en la DB 
        // (por ejemplo, le han borrado la cuenta)
        http_response_code(404);
        echo json_encode(["error" => "El usuario ya no existe en la base de datos"]);
    }

} catch (Exception $e) {
    // Si algo sale mal al descifrar el Token (Caducado, Manipulado, o Formato Inválido)
    // El Backend le manda un 401 (Unauthorized) al Frontend, el cual debería reaccionar
    // borrando el Token del LocalStorage y mandando al usuario a la pantalla de Login.
    http_response_code(401);
    echo json_encode(["error" => "Token inválido o sesión expirada"]);
}

$conexion = null;
