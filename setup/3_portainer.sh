#!/bin/bash

# 1. Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# 2. Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

echo "1. Iniciando el despliegue automático de Portainer..."

# Preguntar al usuario sobre el origen del archivo YAML
echo "¿Como deseas instalar Portainer?"
echo "1) Descargar el setup desde el enlace oficial"
echo "2) Usar la versión local (en caso de que la descarga falle usa esta opción)"
read -p "Elige una opción (1 o 2): " opcion_yaml

# 3. Usar el directorio temporal (/tmp). Así no ensuciamos el /home de ningún usuario.
# Todo lo que caiga en /tmp se borra solo al reiniciar, doble seguridad.
cd /tmp

# 4. Obtener el archivo según la elección del usuario
if [ "$opcion_yaml" == "2" ]; then
  if [ -f "$SCRIPT_DIR/portainer-agent-stack.yml" ]; then
    echo "Copiando el archivo local a /tmp para procesarlo..."
    cp "$SCRIPT_DIR/portainer-agent-stack.yml" ./portainer-agent-stack.yml
  else
    echo "Error: No se ha encontrado el archivo 'portainer-agent-stack.yml' en $SCRIPT_DIR."
    echo "Abortando..."
    exit 1
  fi
else
  # Opción 1 o cualquier otra tecla por defecto será descargar
  echo "2. Descargando el .yml oficial de Portainer..."
  curl -sL https://downloads.portainer.io/ce-lts/portainer-agent-stack.yml -o portainer-agent-stack.yml

  # La magia de 'sed': Busca el texto 8000:8000 y lo cambia por 8001:8000 dentro del archivo al vuelo
  echo "3. Modificando el mapeo de puertos para evitar problemas con el backend PHP (8000 -> 8001)..."
  sed -i 's/8000:8000/8001:8000/g' portainer-agent-stack.yml
fi

# 5. Desplegar el stack en Swarm
echo "4. Mandando la orden de despliegue a Docker Swarm..."
docker stack deploy -c portainer-agent-stack.yml portainer

# 6. Comprobación inteligente (El bucle de espera)
echo -n "5. Esperando a que los contenedores arranquen (esto puede tardar si está descargando la imagen)"
# Este bucle mira la lista de servicios cada 3 segundos hasta que detecta que portainer está "1/1" (Corriendo)
while ! docker service ls | grep -E "portainer_portainer.*1/1" > /dev/null; do
    sleep 3
    echo -n "."
done
echo "" # Salto de línea para que quede bonito

# 7. Limpieza
echo "6. Limpiando el rastro (borrando el .yml)..."
rm -f portainer-agent-stack.yml

echo "Portainer desplegado con éxito. Pruebalo en http://192.168.50.1/portainer"