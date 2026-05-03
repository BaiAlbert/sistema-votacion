<?php
/**
 * Servicio de Auditoría de Integridad ("Urna Criptográfica")
 *
 * Verifica recursivamente la cadena de bloques generada por los votos anónimos
 * para detectar manipulaciones directas en la base de datos.
 */

class IntegridadService {
    /**
     * Realiza la auditoría de integridad para una votación específica.
     *
     * @param int $id_votacion El ID de la votación a auditar.
     * @param PDO $conexion Conexión activa a la base de datos.
     * @param string $blockchain_secret Secreto usado para firmar los hashes HMAC.
     * @return bool True si la cadena es íntegra, False si está corrupta.
     */
    public static function auditar($id_votacion, $conexion, $blockchain_secret) {
        try {
            // Obtenemos todos los votos de esta votación ordenados cronológicamente por ID
            $stmt = $conexion->prepare("SELECT id, id_opcion, hash_integridad FROM votos_anonimos WHERE id_votacion = ? ORDER BY id ASC");
            $stmt->execute([$id_votacion]);
            $votos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Si no hay votos, la consideramos íntegra por defecto
            if (empty($votos)) {
                $update = $conexion->prepare("UPDATE votaciones SET estado_auditoria = 'integra', fecha_auditoria = NOW() WHERE id = ?");
                $update->execute([$id_votacion]);
                return true;
            }

            // Inicializamos el hash esperado con el hash "génesis"
            $hash_esperado = hash('sha256', "genesis_votacion_" . $id_votacion);

            foreach ($votos as $voto) {
                // Re-calculamos la firma tal como debería haberse creado en votar.php
                $datosPapeleta = $id_votacion . "_" . $voto['id_opcion'] . "_" . $hash_esperado;
                $hash_calculado = hash_hmac('sha256', $datosPapeleta, $blockchain_secret);

                // Verificamos si la firma registrada coincide con la calculada
                if ($hash_calculado !== $voto['hash_integridad']) {
                    // ¡Rotura de cadena! La base de datos fue manipulada
                    $update = $conexion->prepare("UPDATE votaciones SET estado_auditoria = 'corrupta', fecha_auditoria = NOW() WHERE id = ?");
                    $update->execute([$id_votacion]);
                    return false;
                }
                
                // Si cuadra, el hash calculado se convierte en el "previousHash" para el siguiente voto
                $hash_esperado = $hash_calculado;
            }

            // Si el bucle termina con éxito, todos los votos cuadran en la cadena
            $update = $conexion->prepare("UPDATE votaciones SET estado_auditoria = 'integra', fecha_auditoria = NOW() WHERE id = ?");
            $update->execute([$id_votacion]);
            return true;
            
        } catch (PDOException $e) {
            // En caso de error de DB, no podemos garantizar la integridad, así que lo dejamos pendiente o lanzamos error.
            // Para ser robustos, devolvemos false, pero no marcamos como corrupta sin pruebas.
            error_log("Error en IntegridadService::auditar - " . $e->getMessage());
            return false;
        }
    }
}
?>
