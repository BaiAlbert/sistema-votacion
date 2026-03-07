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
    // Validamos que se hayan enviado el email y la contraseña
    if (empty($input['email']) || empty($input['password'])) {
        http_response_code(400); // Bad request
        echo json_encode(["error" => "Email y contraseña requeridos"]);
        exit;
    }

    $email = $input['email'];
    $password = $input['password'];

    // Validamos el Email con su respectivo formato antes de ir a la base de datos
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["error" => "El formato del correo es inválido"]);
        exit;
    }

    // Preparamos la consulta SQL para buscar al usuario por su correo electrónico.
    // El uso de '?' evita ataques de Inyección SQL.
    $sql = "SELECT id, dni, username, password, nombre, apellidos, email, num_telefono, provincia, ciudad, rol, fecha_creacion FROM usuarios WHERE email = ?";
    $stmt = $conexion->prepare($sql);
    
    // Ejecutamos la consulta inyectando la variable $email de forma segura
    $stmt->execute([$email]);

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
            $jwt = JWT::encode($payload, $jwt_secret, 'HS256');

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
        // No se encontró ningún usuario con ese email
        http_response_code(401);
        echo json_encode(["error" => "Usuario no encontrado"]);
    }
}
$conexion = null;
