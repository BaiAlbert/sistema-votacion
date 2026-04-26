// Definimos que orígenes son "buenos" (Lista blanca de orígenes)
$origenes_permitidos = [
    'http://localhost:3000', // Para desarrollo en local
    'http://192.168.50.1', // Para el clúster Swarm (Frontend web)
    'http://192.168.50.1:3000' // Por si atacan al puerto directo
];

// Comprobamos de dónde viene la petición
$origen_peticion = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origen_peticion, $origenes_permitidos)) {
    // Si es el frontend, abrimos la puerta específicamente al frontend
    header("Access-Control-Allow-Origin: " . $origen_peticion);
} else {
    // Si no sabemos de dónde viene, por seguridad bloqueamos (o ponemos el de por defecto)
    header("Access-Control-Allow-Origin: http://192.168.50.1");
}

// El resto de cabeceras
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}
