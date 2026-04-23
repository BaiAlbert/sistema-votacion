#!/bin/bash

# Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

# Apagamos Grafana y Prometheus de esta manera porque son servicios
# con volumenes al igual que la base de datos, entonces apagarlos del tirón
# haciendo shutdown a la maquina puede provocar problemas
echo "Apagando Grafana..."
docker service scale app_votaciones_grafana=0
sleep 10

echo "Apagando Prometheus..."
docker service scale app_votaciones_prometheus=0
sleep 10

echo "Iniciando el apagado ordenado del cluster MariaDB Galera..."

echo "Escalando db-node3 a 0..."
sudo docker service scale app_votaciones_db-node3=0
sleep 10

echo "Escalando db-node2 a 0..."
sudo docker service scale app_votaciones_db-node2=0
sleep 10

echo "Escalando db-node1 a 0 (guardando estado safe_to_bootstrap)..."
sudo docker service scale app_votaciones_db-node1=0
sleep 10

echo "Base de datos apagada correctamente. Ya puedes apagar las maquinas."