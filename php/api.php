<?php
// Permitir acceso desde cualquier origen (o específicamente desde tu puerto de React)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

// Simulamos datos de una base de datos
$usuarios = [
    ["id" => 1, "nombre" => "Ana", "rol" => "Admin"],
    ["id" => 2, "nombre" => "Carlos", "rol" => "Usuario"],
    ["id" => 3, "nombre" => "Tu", "rol" => "Dev"]
];

// Devolvemos los datos en formato JSON
echo json_encode($usuarios);
?>