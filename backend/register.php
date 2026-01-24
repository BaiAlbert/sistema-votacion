<?php

/**
 * Endpoint de Registro
 *
 * Gestiona el registro de nuevos usuarios. Acepta JSON con los detalles del usuario
 * (nombre de usuario, contraseña, nombre, etc.), hashea la contraseña e inserta el
 * nuevo registro en la tabla 'usuarios'.
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

// Leer el input JSON
$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validamos los campos obligatorios
    if (empty($input['username']) || empty($input['password']) || empty($input['email'])) {
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "Datos incompletos"]);
        exit;
    }

    $username = $input['username'];
    // Hasheamos la contraseña usando el algoritmo por defecto (actualmente bcrypt)
    // Esto es esencial para la seguridad ya que nunca debemos guardar contraseñas en texto plano.
    $password = password_hash($input['password'], PASSWORD_DEFAULT);

    // Recogemos el resto de campos
    $nombre = $input['nombre'] ?? '';
    $apellidos = $input['apellidos'] ?? '';
    $email = $input['email'];
    $telefono = $input['telefono'] ?? 0;
    $provincia = $input['provincia'] ?? '';
    $ciudad = $input['ciudad'] ?? '';

    // Preparamos la sentencia SQL INSERT
    // Usamos signos de interrogación (?) como marcadores para prevenir inyección SQL
    $sql = "INSERT INTO usuarios (username, password, nombre, apellidos, email, num_telefono, provincia, ciudad) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conexion->prepare($sql);

    // Vinculamos los parámetros a la sentencia preparada
    // "sssssiss" indica los tipos: s (string), i (integer)
    $stmt->bind_param("sssssiss", $username, $password, $nombre, $apellidos, $email, $telefono, $provincia, $ciudad);

    // Ejecutamos la consulta
    if ($stmt->execute()) {
        echo json_encode(["message" => "Usuario registrado con éxito"]);
    } else {
        // Si falla (ej. usuario o email duplicado), devolvemos error 500
        http_response_code(500);
        echo json_encode(["error" => "Error al registrar: " . $stmt->error]);
    }

    $stmt->close();
}
$conexion->close();
