#!/bin/bash

# Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

echo "Iniciando actualización de Nginx..."

# Cambia "votacion_nginx" por el nombre exacto de tu servicio si es distinto
NOMBRE_SERVICIO="app_votaciones_nginx"

echo "Buscando contenedor de Nginx..."
CONTAINER_ID=$(docker ps -q -f name=$NOMBRE_SERVICIO)

if [ -z "$CONTAINER_ID" ]; then
    echo "Error: No se encontró Nginx en ejecución."
    exit 1
fi

echo "Comprobando sintaxis del archivo de configuración..."
if docker exec "$CONTAINER_ID" nginx -t; then
    echo "Sintaxis correcta. Reiniciando el contenedor para enlazar los nuevos cambios..."
    
    # Aquí aplicamos el "Restart" en lugar del "Reload" para solucionar el problema del inodo
    docker restart "$CONTAINER_ID"
    
    echo "Actualización completada y aplicada con éxito."
else
    echo "Error de sintaxis. No se ha recargado."
    exit 1
fi