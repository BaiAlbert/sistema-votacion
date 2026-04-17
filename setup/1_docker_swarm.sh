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

# Lista de IPs de los workers
WORKERS=("192.168.50.2" "192.168.50.3" "192.168.50.4")

echo "1. Instalando Docker en la máquina local (Manager)"
# Descargamos en /tmp, instalamos, borramos el script e iniciamos el servicio
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
sh /tmp/get-docker.sh
rm /tmp/get-docker.sh
systemctl enable docker
systemctl start docker

echo ""
echo "2. Instalando Docker en las máquinas remotas"
echo "Es posible que ahora pida contraseña"
for IP in "${WORKERS[@]}"; do
    echo " - Descargando e instalando en $IP..."
    # Mandamos el comando por SSH. Descargamos en /tmp, ejecutamos, borramos y levantamos el servicio.
    ssh $USUARIO@$IP "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sudo sh /tmp/get-docker.sh && rm /tmp/get-docker.sh && sudo systemctl enable docker && sudo systemctl start docker"
done

echo ""
echo "3. Creando Docker Swarm"

# Inicializamos el clúster usando la IP del manager
MANAGER_IP="192.168.50.1"
docker swarm init --advertise-addr $MANAGER_IP

# Extraemos el token secreto necesario para que los workers se unan
TOKEN=$(docker swarm join-token worker -q)

echo "El Manager está corriendo en la IP: $MANAGER_IP"
echo "El token de unión es: $TOKEN"

echo ""
echo "4. Uniendo el resto de máquinas a nuestro nuevo Swarm"
for IP in "${WORKERS[@]}"; do
    echo " - Uniendo la máquina $IP al Swarm..."
    ssh $USUARIO@$IP "sudo docker swarm join --token $TOKEN $MANAGER_IP:2377"
done

echo ""
echo "La instalación de Docker y la creación del Swarm ha finalizado."
echo "Ejecuta 'docker node ls' en esta máquina para ver los nodos conectados."