#!/bin/bash

# 1. Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# 2. Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

echo "Iniciando el despliegue automático del archivo de repositorios locales (Registry)..."

# 3. Primero debemos configurar Docker
echo "Configurando Docker para permitir el registry inseguro en 192.168.50.1:5000..."
# Creamos la carpeta por si es una instalación tan limpia que ni siquiera existe el directorio
mkdir -p /etc/docker
# Inyectamos la configuración
echo "{ \"insecure-registries\" : [\"192.168.50.1:5000\"] }" > /etc/docker/daemon.json

# 4. Aplicamos los cambios
echo "Reiniciando el servicio de Docker para que se aplique la nueva configuración..."
systemctl restart docker

# 5. Limpieza previa (Idempotencia)
# Si por error ejecutas este script dos veces, Docker daría error diciendo que el nombre "repositorios" ya existe.
# Esta línea borra el contenedor antiguo en silencio (si existe) para que no haya conflictos.
docker rm -f repositorios 2>/dev/null || true

# 6. Lanzar el Registry
echo "Desplegando el contenedor del Registry..."
docker run -d -p 5000:5000 --restart=always --name repositorios registry:2

echo "Registry local desplegado y listo para recibir builds en 192.168.50.1:5000"