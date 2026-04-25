<?php

/**
 * Endpoint de Inicio de Sesión
 *
 * Gestiona la autenticación de usuarios. Acepta JSON con 'email' y 'password'.
 * Verifica el hash de la contraseña en la base de datos y devuelve el objeto de usuario
 * (pero no la contraseña) si la autenticación es exitosa.
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

include_once 'config/db.php';

$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validamos que se hayan enviado el DNI y la contraseña
    if (empty($input['dni']) || empty($input['password'])) {
        http_response_code(400); // Bad request
        echo json_encode(["error" => "DNI y contraseña requeridos"]);
        exit;
    }

    $dni = $input['dni'];
    $password = $input['password'];

    // Validamos el formato del DNI
    if (!preg_match('/^[0-9]{8}[A-Za-z]$/', $dni)) {
        http_response_code(400);
        echo json_encode(["error" => "El formato del DNI es inválido"]);
        exit;
    }

    // Hasheamos el DNI para compararlo con la base de datos
    $dni_hash = hash_hmac('sha256', strtoupper($dni), $dni_pepper);

    // Preparamos la consulta SQL para buscar al usuario por su DNI hasheado.
    // El uso de '?' evita ataques de Inyección SQL.
    $sql = "SELECT id, password, nombre, apellidos, email, num_telefono, provincia, ciudad, rol, fecha_creacion FROM usuarios WHERE dni_hash = ?";
    $stmt = $conexion->prepare($sql);
    
    // Ejecutamos la consulta inyectando la variable $dni_hash de forma segura
    $stmt->execute([$dni_hash]);

    // Comprobamos si el usuario existe en la base de datos volcando el resultado en $user
    if ($user = $stmt->fetch()) {
        // Verificamos si la contraseña en texto plano enviada por el frontend 
        // coincide con el hash encriptado (Bcrypt) que guardamos en la base de datos
        if (password_verify($password, $user['password'])) {
            // Login exitoso: Generamos el Token JWT (JSON Web Token)
            // Este token servirá como "tarjeta de identificación" virtual
            $issuedAt = time();
            $expirationTime = $issuedAt + (60 * 60 * 24); // Válido por 24 horas

            // Construimos la carga útil (Payload) del JWT, guardando el ID y el Rol
            // para no tener que consultarlos a la base de datos en cada petición futura
            $payload = [
                'iat' => $issuedAt,
                'exp' => $expirationTime,
                'data' => [
                    'id' => $user['id'],
                    'rol' => $user['rol']
                ]
            ];

            // Encriptamos el Token apuntando a la semilla secreta del servidor ($jwt_secret)
            // IMPORTANTE: $jwt_secret viene incluido mágicamente desde el archivo config/db.php
            $jwt = JWT::encode($payload, $jwt_secret, 'HS512');

            // Devolvemos el Token al Frontend para que lo guarde en su LocalStorage
            echo json_encode([
                "message" => "Login exitoso",
                "token" => $jwt
            ]);
        } else {
            // La contraseña no coincide
            http_response_code(401); // Unauthorized
            echo json_encode(["error" => "Credenciales incorrectas"]);
        }
    } else {
        // No se encontró ningún usuario con ese DNI
        http_response_code(401);
        echo json_encode(["error" => "Usuario no encontrado"]);
    }
}
$conexion = null;
