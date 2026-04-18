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
cp -f nginx/sistema-votacion /etc/nginx/sites-available/sistema-votacion
# Creamos el acceso directo en sites-enabled para que Nginx lo lea
ln -sf /etc/nginx/sites-available/sistema-votacion /etc/nginx/sites-enabled/sistema-votacion
# Comprobamos y recargamos (reload es mejor que restart para no tirar a otros usuarios)
nginx -t
systemctl reload nginx

# 5. Creación de Secretos (Idempotente: solo los crea si no existen)
echo "Verificando secrets de Docker..."

if ! docker secret ls | grep -qw "db_root_password"; then
    echo "Creando secreto db_root_password..."
    openssl rand -base64 32 | docker secret create db_root_password -
fi

if ! docker secret ls | grep -qw "db_password"; then
    echo "Creando secreto db_password..."
    openssl rand -base64 32 | docker secret create db_password -
fi

if ! docker secret ls | grep -qw "jwt_secret"; then
    echo "Creando secreto jwt_secret..."
    openssl rand -hex 64 | docker secret create jwt_secret -
fi

# 6. Compilación y subida de imágenes
echo "Compilando y subiendo la Base de Datos..."
docker build -t $REGISTRY/votacion-db:latest ./database
docker push $REGISTRY/votacion-db:latest

echo "Compilando y subiendo el Backend..."
docker build -t $REGISTRY/votacion-backend:latest ./backend
docker push $REGISTRY/votacion-backend:latest

echo "Compilando y subiendo el Frontend..."
docker build -t $REGISTRY/votacion-frontend:latest ./frontend
docker push $REGISTRY/votacion-frontend:latest

# 7. Añadir labels a los nodos para que los servicios sepan en que maquinas alojarse
docker node update --label-add role=database servidor-db
docker node update --label-add role=app servidor-worker1
docker node update --label-add role=app servidor-worker2

# 8. Despliegue final en el clúster
echo "Desplegando el stack completo de la aplicación en nuestro swarm..."
docker stack deploy -c docker-compose.yml app_votaciones

echo "La aplicación ha sido desplegada y está corriendo."