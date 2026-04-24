#!/bin/bash

# 1. Modo de seguridad: Detener el script inmediatamente si algún comando falla
set -e

# 2. Comprobar que se está ejecutando con sudo (root)
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta el script con 'sudo'."
  exit 1
fi

# Variables que puedan necesitar cambios en un futuro
REPO_URL="https://github.com/BaiAlbert/sistema-votacion.git"
APP_DIR="/opt/sistema-votacion" # /opt es la carpeta estándar para apps en Linux
REGISTRY="192.168.50.1:5000"

echo "Iniciando el despliegue maestro del Sistema de Votación..."

# 3. Lógica Git: Clonar si no existe, o hacer pull si ya existe
if [ -d "$APP_DIR/.git" ]; then
    echo "El directorio ya existe. Descargando últimos cambios desde GitHub..."
    cd "$APP_DIR"
    # Forzamos a que machaque cualquier cambio local y se quede con lo de GitHub
    git fetch --all
    git reset --hard origin/main
    chmod +x setup/*.sh
else
    echo "Clonando el repositorio en $APP_DIR..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 4. Instalación y configuración de Nginx
echo "Comprobando e instalando Nginx..."

# Actualizamos la lista de paquetes
# Usamos -qq para que sea silencioso y no llene la pantalla de texto basura
apt-get update -qq

# Instalamos Nginx. La bandera -y es CRUCIAL para que no pregunte "Do you want to continue? [Y/n]"
apt-get install -y nginx

# Borramos la configuración por defecto de Nginx que viene de fábrica
# Esto evita el clásico error de "el puerto 80 ya está en uso"
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

# Nos aseguramos de que el servicio esté activado para que arranque si la máquina se reinicia
systemctl enable nginx
systemctl start nginx

echo "Configurando Nginx..."
# Copiamos usando rutas relativas (como ya hemos hecho 'cd', el archivo está justo aquí)
cp -f infra/nginx/sistema-votacion /etc/nginx/sites-available/sistema-votacion
# Creamos el acceso directo en sites-enabled para que Nginx lo lea
ln -sf /etc/nginx/sites-available/sistema-votacion /etc/nginx/sites-enabled/sistema-votacion
# Comprobamos y recargamos (reload es mejor que restart para no tirar a otros usuarios)
nginx -t
systemctl reload nginx

# 5. Creación de Secretos (Idempotente: solo los crea si no existen)
echo "Verificando secrets de Docker..."

if ! docker secret ls | grep -qw "db_root_password"; then
    echo "Creando secreto db_root_password..."
    openssl rand -base64 16 | docker secret create db_root_password -
fi

if ! docker secret ls | grep -qw "db_password"; then
    echo "Creando secreto db_password..."
    openssl rand -base64 16 | docker secret create db_password -
fi

if ! docker secret ls | grep -qw "galera_sync_password"; then
    echo "Creando secreto galera_sync_password..."
    openssl rand -base64 16 | docker secret create galera_sync_password -
fi

if ! docker secret ls | grep -qw "jwt_secret"; then
    echo "Creando secreto jwt_secret..."
    openssl rand -hex 64 | docker secret create jwt_secret -
fi

# 6. Compilación y subida de imágenes
# echo "Compilando y subiendo la Base de Datos..."
# docker build -t $REGISTRY/votacion-db-galera:latest ./database
# docker push $REGISTRY/votacion-db-galera:latest

docker builder prune -a -f

echo "Compilando y subiendo el Backend..."
docker build -t $REGISTRY/votacion-backend:latest ./backend
docker push $REGISTRY/votacion-backend:latest

docker builder prune -a -f

echo "Compilando y subiendo el Frontend..."
docker build -t $REGISTRY/votacion-frontend:latest ./frontend
docker push $REGISTRY/votacion-frontend:latest

docker builder prune -a -f

# 7. Añadir labels a los nodos
echo "Asignando etiquetas a los nodos del clúster..."
docker node update --label-add role=database servidor-db 2>/dev/null || true
docker node update --label-add role=app servidor-worker1 2>/dev/null || true
docker node update --label-add role=app servidor-worker2 2>/dev/null || true
# El '2>/dev/null || true' es para que el script no falle si el label ya existe en futuras ejecuciones

# 8. Despliegue Maestro en Docker Swarm
echo "Iniciando la secuencia de despliegue con el clúster MariaDB Galera..."

# 8.1 Preparación del archivo YAML (Modo Arranque)
# Por si quedó un YAML modificado de pruebas anteriores
echo "Configurando YAML para arranque inicial (Bootstrap: yes, Replicas: 0)..."
sed -i "s/MARIADB_GALERA_CLUSTER_BOOTSTRAP: 'no'/MARIADB_GALERA_CLUSTER_BOOTSTRAP: 'yes'/g" docker-compose.yml
sed -i "s/replicas: 1 # TARGET_NODO_GALERA/replicas: 0 # TARGET_NODO_GALERA/g" docker-compose.yml

# 8.2 Primer Despliegue (Nace todo, pero Galera nace apagado)
echo "Desplegando el stack completo..."
docker stack deploy -c docker-compose.yml app_votaciones

# 8.3 Encendido del db-node1
echo "Encendiendo el db-node1 (Líder temporal)..."
docker service scale app_votaciones_db-node1=1

# Esperamos a que el nodo 1 forme el clúster. 
# En máquinas no tan rápidas o en el primer arranque, puede tardar hasta un minuto.
echo "Esperando 45 segundos a que el líder cree el Primary Component..."
sleep 45

# 8.4 Encendido de los nodos secundarios
echo "Encendiendo db-node2 y db-node3 para que se unan al líder..."
docker service scale app_votaciones_db-node2=1 app_votaciones_db-node3=1

# Esperamos a que hagan la transferencia de estado (SST)
echo "Esperando 30 segundos a que los nodos secundarios se sincronicen..."
sleep 30

# 8.5 Modificación final del docker-compose (Modo Producción)
# Lo dejamos asi post primer arranque para que no haya problemas si mueren y reinician
echo "Modificando el docker-compose.yml para desactivar el Bootstrap..."
sed -i "s/MARIADB_GALERA_CLUSTER_BOOTSTRAP: 'yes'/MARIADB_GALERA_CLUSTER_BOOTSTRAP: 'no'/g" docker-compose.yml
sed -i "s/replicas: 0 # TARGET_NODO_GALERA/replicas: 1 # TARGET_NODO_GALERA/g" docker-compose.yml

# 8.6 Despliegue Final
echo "Desplegando configuración definitiva en Swarm..."
docker stack deploy -c docker-compose.yml app_votaciones

# Limpieza final de caché del builder
docker builder prune -a -f

echo "La aplicación ha sido desplegada con éxito."
