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
require 'vendor/autoload.php';
use Firebase\JWT\JWT;

include_once 'config/db.php';

// Configuración CORS (Cross-Origin Resource Sharing)
// Como React está en el puerto 5173 y PHP en el 8000 (puertos distintos), 
// el navegador bloquea las peticiones por seguridad. Aquí le damos permiso:

// Permitir peticiones desde cualquier origen temporalmente (*)
header("Access-Control-Allow-Origin: *");

// Permitir que el frontend nos envíe datos en formato JSON (Content-Type)
header("Access-Control-Allow-Headers: Content-Type");

// Permitir los métodos que vamos a usar (POST para enviar datos, OPTIONS por seguridad)
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Decirle al navegador que nuestra respuesta a partir de ahora siempre será un JSON
header("Content-Type: application/json");

// Manejo de requests "PREFLIGHT" (OPTIONS)
// Antes de hacer un POST con JSON, el navegador hace una petición "fantasma"
// llamada OPTIONS para preguntar si tiene permiso. Le decimos "todo OK" (código 200)
// y abortamos la ejecución de PHP aquí para que no siga leyendo el código de abajo.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

    // Preparamos la consulta SQL para buscar al usuario por su email
    $sql = "SELECT id, dni, username, password, nombre, apellidos, email, num_telefono, provincia, ciudad, rol, fecha_creacion FROM usuarios WHERE email = ?";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([$email]);

    // Comprobamos si el usuario existe en la base de datos
    if ($user = $stmt->fetch()) {
        // Verificamos si la contraseña enviada coincide con el hash almacenado
        if (password_verify($password, $user['password'])) {
            // Login exitoso: Generamos el Token JWT
            $issuedAt = time();
            $expirationTime = $issuedAt + (60 * 60 * 24); // Válido por 24 horas

            $payload = [
                'iat' => $issuedAt,
                'exp' => $expirationTime,
                'data' => [
                    'id' => $user['id']
                ]
            ];

            // $jwt_secret viene incluido desde config/db.php
            $jwt = JWT::encode($payload, $jwt_secret, 'HS256');

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
