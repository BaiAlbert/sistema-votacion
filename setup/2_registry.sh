#!/bin/bash

# 1. Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# 2. Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

USUARIO="alberto-ramirez" 
WORKERS=("192.168.50.2" "192.168.50.3" "192.168.50.4")

echo "Iniciando el despliegue automático del archivo de repositorios locales (Registry)..."

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
echo "Configurando Docker local para permitir el registry inseguro en 192.168.50.1:5000..."
mkdir -p /etc/docker
tee /etc/docker/daemon.json > /dev/null <<EOF
{
    "insecure-registries" : ["192.168.50.1:5000"]
}
EOF

echo "Reiniciando el servicio de Docker local para aplicar cambios..."
systemctl restart docker

# 5. Inyectar la configuración en los Workers remotos por SSH
echo ""
echo "Enviando la configuración de Docker a los Workers remotos..."
echo "ATENCIÓN: Te pedirá la contraseña de $USUARIO para el sudo en cada máquina."

for IP in "${WORKERS[@]}"; do
    echo " - Inyectando JSON y reiniciando Docker en $IP..."
    
    # Mandamos un bloque de comandos multilínea por SSH. 
    # Usamos <<'REMOTE_EOF' para que el texto viaje tal cual y se procese en la otra máquina.
    sudo -u $USUARIO ssh -t $USUARIO@$IP "
        sudo mkdir -p /etc/docker &&
        sudo tee /etc/docker/daemon.json > /dev/null <<'REMOTE_EOF'
{
    \"insecure-registries\" : [\"192.168.50.1:5000\"]
}
REMOTE_EOF
        sudo systemctl restart docker
    "
done

# 6. Lanzar el Registry local
echo ""
echo "Desplegando el contenedor del Registry en el Manager..."
docker run -d -p 5000:5000 --restart=always --name repositorios registry:latest

echo ""
echo "Registry local desplegado y nodos configurados para permitir el registry en 192.168.50.1:5000"