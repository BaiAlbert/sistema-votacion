#!/bin/bash

# Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

echo -e "Iniciando limpieza de Docker"
echo ""

# Guardar el espacio en disco antes de empezar
ESPACIO_ANTES=$(df -h / | awk 'NR==2 {print $4}')
echo -e "Espacio libre antes de la limpieza: $ESPACIO_ANTES\n"

echo -e "[1/4] Borrando contenedores detenidos..."
docker container prune -f

echo -e "[2/4] Borrando redes sin utilizar..."
docker network prune -f

echo -e "[3/4] Borrando todas las imágenes sin uso..."
# El flag -a borra cualquier imagen que no esté asignada a un contenedor vivo
docker image prune -a -f

echo -e "[4/4] Vaciando la caché del builder..."
docker builder prune -a -f

echo -e "Limpieza completada."
# Guardar el espacio en disco después de terminar
ESPACIO_DESPUES=$(df -h / | awk 'NR==2 {print $4}')
echo -e "Espacio libre ahora: $ESPACIO_DESPUES"
echo ""