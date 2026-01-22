<?php
// Permisos CORS (vital para que React no se queje)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

// Incluimos la conexión que acabamos de crear
include_once 'db.php';

try {
    // Preparamos la consulta SQL
    $stmt = $pdo->query("SELECT * FROM usuarios");

    // Obtenemos los datos en un array asociativo
    $usuarios = $stmt->fetchAll();

    // Lo enviamos como JSON a React
    echo json_encode($usuarios);
} catch (PDOException $e) {
    // En caso de error, devolvemos un JSON con el error
    echo json_encode(["error" => $e->getMessage()]);
}
