#!/bin/bash

# 1. Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# 2. Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

# El usuario con el que se conecta por SSH a las otras máquinas
USUARIO="alberto-ramirez" 

# La IP de la máquina principal
MANAGER_IP="192.168.1.250"

# Lista de IPs de los workers
WORKERS=("192.168.1.249" "192.168.1.248" "192.168.1.247")

echo ""
echo "1. Creando Docker Swarm..."
docker swarm init --advertise-addr $MANAGER_IP

TOKEN=$(docker swarm join-token worker -q)

echo "El Manager está corriendo en la IP: $MANAGER_IP"
echo "El token de unión es: $TOKEN"

echo ""
echo "2. Uniendo el resto de máquinas a nuestro nuevo Swarm..."
for IP in "${WORKERS[@]}"; do
    echo " - Uniendo la máquina $IP al Swarm..."
    # Mismo parche aquí: sudo -u y -t
    sudo -u $USUARIO ssh -t $USUARIO@$IP "sudo docker swarm join --token $TOKEN $MANAGER_IP:2377"
done

echo ""
echo "¡La creación del Swarm ha finalizado!"
echo "Ejecuta 'docker node ls' en la máquina manager para ver los nodos conectados."