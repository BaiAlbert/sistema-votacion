#!/bin/bash

# 1. Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# 2. Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

echo "Iniciando el despliegue automático de Portainer..."

# 3. Usar el directorio temporal (/tmp). Así no ensuciamos el /home de ningún usuario.
# Todo lo que caiga en /tmp se borra solo al reiniciar, doble seguridad.
cd /tmp

# 4. Descargar el archivo YAML (la bandera -s oculta la barra de carga fea de curl)
echo "Descargando el .yml oficial de Portainer..."
curl -sL https://downloads.portainer.io/ce-lts/portainer-agent-stack.yml -o portainer-agent-stack.yml

# 5. La magia de 'sed': Busca el texto 8000:8000 y lo cambia por 8001:8000 dentro del archivo al vuelo
echo "Modificando el mapeo de puertos para evitar problemas con el backend PHP (8000 -> 8001)..."
sed -i 's/8000:8000/8001:8000/g' portainer-agent-stack.yml

# 6. Desplegar el stack en Swarm
echo "Mandando la orden de despliegue a Docker Swarm..."
docker stack deploy -c portainer-agent-stack.yml portainer

# 7. Comprobación inteligente (El bucle de espera)
echo -n "Esperando a que los contenedores arranquen (esto puede tardar si está descargando la imagen)"
# Este bucle mira la lista de servicios cada 3 segundos hasta que detecta que portainer está "1/1" (Corriendo)
while ! docker service ls | grep -E "portainer_portainer.*1/1" > /dev/null; do
    sleep 3
    echo -n "."
done
echo "" # Salto de línea para que quede bonito

# 8. Limpieza
echo "Limpiando el rastro (borrando el .yml)..."
rm -f portainer-agent-stack.yml

echo "Portainer desplegado con éxito. Pruebalo en http://192.168.50.1/portainer"