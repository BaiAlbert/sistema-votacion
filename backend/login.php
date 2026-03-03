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
include_once 'config/db.php';

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

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

    // Validar Email con su respectivo formato antes de ir a BD
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
            // Si la contraseña es correcta eliminamos la contraseña del objeto antes de enviarlo
            unset($user['password']);

            // Devolvemos los datos del usuario (el frontend puede guardarlos en localStorage)
            echo json_encode(["message" => "Login exitoso", "user" => $user]);
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
