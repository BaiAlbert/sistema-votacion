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
    if (empty($input['username']) || empty($input['password']) || empty($input['email']) || empty($input['dni'])) {
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "Datos incompletos"]);
        exit;
    }

    $username = $input['username'];
    // Hasheamos la contraseña usando el algoritmo por defecto (actualmente bcrypt)
    // Esto es esencial para la seguridad ya que nunca debemos guardar contraseñas en texto plano.
    $password = password_hash($input['password'], PASSWORD_DEFAULT);

    // Recogemos el resto de campos
    $dni = $input['dni'];
    $nombre = $input['nombre'] ?? '';
    $apellidos = $input['apellidos'] ?? '';
    $email = $input['email'];
    $num_telefono = $input['num_telefono'] ?? '';
    $provincia = $input['provincia'] ?? '';
    $ciudad = $input['ciudad'] ?? '';

    // Validar DNI (8 números y 1 letra)
    if (!preg_match('/^[0-9]{8}[A-Za-z]$/', $dni)) {
        http_response_code(400);
        echo json_encode(["error" => "El DNI debe tener 8 números y una letra"]);
        exit;
    }

    // Validar Email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["error" => "El formato del correo es inválido"]);
        exit;
    }

    // Validar Teléfono
    if (!empty($num_telefono) && !preg_match('/^[0-9]{9}$/', $num_telefono)) {
        http_response_code(400);
        echo json_encode(["error" => "El teléfono debe tener 9 números"]);
        exit;
    }

    // Preparamos la sentencia SQL INSERT
    // Usamos signos de interrogación (?) como marcadores para prevenir inyección SQL
    $sql = "INSERT INTO usuarios (dni, username, password, nombre, apellidos, email, num_telefono, provincia, ciudad) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    try {
        $stmt = $conexion->prepare($sql);
        // Ejecutamos la consulta
        if ($stmt->execute([$dni, $username, $password, $nombre, $apellidos, $email, $num_telefono, $provincia, $ciudad])) {
            echo json_encode(["message" => "Usuario registrado con éxito"]);
        }
    } catch (PDOException $e) {
        // Si falla (ej. usuario o email duplicado), devolvemos error 500
        http_response_code(500);
        echo json_encode(["error" => "Error al registrar: " . $e->getMessage()]);
    }
}
$conexion = null;
