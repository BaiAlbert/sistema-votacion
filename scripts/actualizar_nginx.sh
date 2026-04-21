#!/bin/bash

# Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

echo "Iniciando actualizacion de Nginx..."

ARCHIVO_ORIGEN="./infra/nginx/sistema-votacion"
RUTA_DESTINO="/etc/nginx/sites-available/sistema-votacion"

if [ ! -f "$ARCHIVO_ORIGEN" ]; then
    echo "Error: No se encuentra el archivo en $ARCHIVO_ORIGEN"
    echo "Asegurate de ejecutar el script desde la raiz del proyecto (sistema-votacion/)."
    exit 1
fi

echo "Copiando la nueva configuracion..."
cp "$ARCHIVO_ORIGEN" "$RUTA_DESTINO"

echo "Comprobando si la sintaxis del archivo es correcta..."

if nginx -t; then
    echo "Nueva configuración correcta. Recargando Nginx..."
    systemctl reload nginx
    echo "Actualizacion completada."
else
    echo "Nginx ha detectado un error en el archivo de configuración."
    echo "Revisa el archivo, no se ha recargado el servicio."
    exit 1
fi