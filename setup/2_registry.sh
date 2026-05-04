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

echo "1. Despliegue automático del archivo de repositorios locales (Registry local)..."

# 3. Comprobación interactiva del contenedor
# Buscamos si ya existe un contenedor llamado exactamente "repositorios"
if docker ps -a --format '{{.Names}}' | grep -Eq "^repositorios$"; then
    echo ""
    echo "Se ha encontrado un contenedor ya llamado 'repositorios'."
    # Preguntamos qué hacer y guardamos la letra en la variable RESPUESTA
    read -p "¿Quieres eliminarlo y crearlo de nuevo? (y/n): " RESPUESTA
    
    if [ "$RESPUESTA" = "y" ] || [ "$RESPUESTA" = "Y" ]; then
        echo "Borrando el contenedor antiguo..."
        docker rm -f repositorios
    else
        echo "Operación cancelada. El script se detendrá."
        exit 0 # Salimos limpiamente sin dar error
    fi
fi

# 4. Configurar Docker en el Manager local
echo ""
echo "2. Configurando Docker local para permitir el registry inseguro en $MANAGER_IP:5000..."
mkdir -p /etc/docker
tee /etc/docker/daemon.json > /dev/null <<EOF
{
    "insecure-registries" : ["$MANAGER_IP:5000"]
}
EOF

echo "3. Reiniciando el servicio de Docker local para aplicar los cambios..."
systemctl restart docker

# 5. Inyectar la configuración en los Workers remotos por SSH
echo ""
echo "4. Enviando la configuración de Docker a los Workers remotos..."
echo "ATENCIÓN: Te pedirá la contraseña de $USUARIO para el sudo en cada máquina."

for IP in "${WORKERS[@]}"; do
    echo " - Inyectando JSON y reiniciando Docker en $IP..."
    
    # Mandamos un bloque de comandos multilínea por SSH. 
    # Usamos <<'REMOTE_EOF' para que el texto viaje tal cual y se procese en la otra máquina.
    sudo -u $USUARIO ssh -t $USUARIO@$IP "
        sudo mkdir -p /etc/docker &&
        sudo tee /etc/docker/daemon.json > /dev/null <<'REMOTE_EOF'
{
    \"insecure-registries\" : [\"$MANAGER_IP:5000\"]
}
REMOTE_EOF
        sudo systemctl restart docker
    "
done

# 6. Lanzar el Registry local
echo ""
echo "5. Desplegando el contenedor del Registry en el Manager..."
docker run -d -p 5000:5000 --restart=always --name repositorios registry:latest

echo ""
echo "Registry local desplegado y nodos configurados para permitir el registry en $MANAGER_IP:5000"