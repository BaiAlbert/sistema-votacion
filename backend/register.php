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

// CONFIGURACIÓN CORS (Debe ir lo primerísimo)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// CONEXIÓN A BASE DE DATOS Y DEPENDENCIAS
include_once 'config/db.php';

// Leer el input JSON
$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validamos los campos obligatorios
    if (empty($input['password']) || empty($input['email']) || empty($input['dni'])) {
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "Datos incompletos"]);
        exit;
    }
    
    // Hasheamos la contraseña usando el algoritmo por defecto (actualmente bcrypt)
    // Esto es esencial para la seguridad, ya que nunca debemos guardar 
    // contraseñas en texto plano en la base de datos (por si hay una filtración).
    $password = password_hash($input['password'], PASSWORD_DEFAULT);

    // Recogemos el resto de campos (usamos el operador "??" para asignar 
    // un string vacío si la clave no viene en el JSON enviado desde el frontend)
    $dni = $input['dni'];
    $nombre = $input['nombre'] ?? '';
    $apellidos = $input['apellidos'] ?? '';
    $email = $input['email'];
    $num_telefono = $input['num_telefono'] ?? '';
    $provincia = $input['provincia'] ?? '';
    $ciudad = $input['ciudad'] ?? '';

    // Obtenemos los límites de caracteres dinámicamente desde la base de datos para no "harcodear"
    // Esto significa que si luego cambiamos el VARCHAR en MySQL, el PHP se adaptará solo.
    // $db (nombre de la base de datos) viene incluido desde config/db.php
    $limites_stmt = $conexion->prepare("SELECT COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'");
    $limites_stmt->execute([$db]);

    // Volcamos los límites en un array donde la Clave es el nombre de la columna y el Valor es el límite numérico
    $limites = $limites_stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $max_email = $limites['email'] ?? 100;

    // Validar Email (dinámico)
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > $max_email) {
        http_response_code(400);
        echo json_encode(["error" => "El formato del correo es inválido o excede los $max_email caracteres"]);
        exit;
    }

    // Validar DNI (8 números y 1 letra)
    if (!preg_match('/^[0-9]{8}[A-Za-z]$/', $dni)) {
        http_response_code(400);
        echo json_encode(["error" => "El DNI debe tener 8 números y una letra"]);
        exit;
    }

    // Hasheamos el DNI para guardarlo de forma anónima
    $dni_hash = hash_hmac('sha256', strtoupper($dni), $dni_pepper);

    // Validar Nombre (sin números, dinámico)
    if (!empty($nombre)) {
        if (!preg_match('/^[\p{L}\s\-\']+$/u', $nombre)) {
            http_response_code(400);
            echo json_encode(["error" => "El nombre no puede contener números ni caracteres inválidos"]);
            exit;
        }
        if (strlen($nombre) > $max_nombre) {
            http_response_code(400);
            echo json_encode(["error" => "El nombre no puede exceder los $max_nombre caracteres"]);
            exit;
        }
    }

    // Validar Apellidos (sin números, dinámico)
    if (!empty($apellidos)) {
        if (!preg_match('/^[\p{L}\s\-\']+$/u', $apellidos)) {
            http_response_code(400);
            echo json_encode(["error" => "Los apellidos no pueden contener números ni caracteres inválidos"]);
            exit;
        }
        if (strlen($apellidos) > $max_apellidos) {
            http_response_code(400);
            echo json_encode(["error" => "Los apellidos no pueden exceder los $max_apellidos caracteres"]);
            exit;
        }
    }

    // Validar Teléfono (9 números, sin letras)
    if (!empty($num_telefono) && !preg_match('/^[0-9]{9}$/', $num_telefono)) {
        http_response_code(400);
        echo json_encode(["error" => "El teléfono debe tener 9 números exactos"]);
        exit;
    }

    // Validar Provincia (sin números, dinámico)
    if (!empty($provincia)) {
        if (!preg_match('/^[\p{L}\s\-\']+$/u', $provincia)) {
            http_response_code(400);
            echo json_encode(["error" => "La provincia no puede contener números ni caracteres inválidos"]);
            exit;
        }
        if (strlen($provincia) > $max_provincia) {
            http_response_code(400);
            echo json_encode(["error" => "La provincia no puede exceder los $max_provincia caracteres"]);
            exit;
        }
    }

    // Validar Ciudad (sin números, dinámico)
    if (!empty($ciudad)) {
        if (!preg_match('/^[\p{L}\s\-\']+$/u', $ciudad)) {
            http_response_code(400);
            echo json_encode(["error" => "La ciudad no puede contener números ni caracteres inválidos"]);
            exit;
        }
        if (strlen($ciudad) > $max_ciudad) {
            http_response_code(400);
            echo json_encode(["error" => "La ciudad no puede exceder los $max_ciudad caracteres"]);
            exit;
        }
    }

    // Preparamos la sentencia SQL INSERT de Inserción de Datos a la BD
    // IMPORTANTISIMO: Usamos signos de interrogación (?) como marcadores.
    // En lugar de concatenar el string, le pasamos los datos a PDO en la ejecución.
    // Esta es la barrera defensiva número uno contra Inyecciones SQL (SQLi).
    $sql = "INSERT INTO usuarios (dni_hash, password, nombre, apellidos, email, num_telefono, provincia, ciudad) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    try {
        $stmt = $conexion->prepare($sql);
        // Ejecutamos la consulta, PDO reemplaza los "?" con los valores de este array de forma segura
        if ($stmt->execute([$dni_hash, $password, $nombre, $apellidos, $email, $num_telefono, $provincia, $ciudad])) {
            echo json_encode(["message" => "Usuario registrado con éxito"]);
        }
    } catch (PDOException $e) {
        // Si falla (ej. usuario o email duplicado), devolvemos error 500
        http_response_code(500);
        echo json_encode(["error" => "Error al registrar: " . $e->getMessage()]);
    }
}
$conexion = null;
