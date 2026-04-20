#!/bin/bash

# Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

echo "Iniciando el arranque del cluster MariaDB Galera..."

echo "Arrancando db-node1 (nodo principal temporal)..."
sudo docker service scale app_votaciones_db-node1=1

echo "Esperando 15 segundos a que el nodo 1 forme el cluster..."
sleep 15

echo "Arrancando db-node2 y db-node3 para que se unan..."
sudo docker service scale app_votaciones_db-node2=1 app_votaciones_db-node3=1

echo "Proceso de arranque terminado. Los nodos se estan sincronizando."