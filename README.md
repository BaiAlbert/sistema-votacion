# sistema-votacion

Sistema de Votaciones Electronicas. TFC Alberto Ramírez Fernández

## Despliegue del Proyecto

Para desplegar y ejecutar este proyecto correctamente en tu entorno local, se recomienda utilizar **Docker Desktop**. Sigue estos pasos:

### 1. Requisitos Previos

- Tener instalado [Docker Desktop](https://www.docker.com/).
- (Opcional) Tener instalado [Node.js](https://nodejs.org/es) y [PHP](https://www.php.net/downloads) si decides no usar Docker y prefieres el script `iniciar.bat`.

### 2. Configuración de Variables de Entorno (.env)

Es **obligatorio** configurar las variables de entorno para que el backend pueda conectarse a la base de datos y pueda firmar los tokens JWT correctamente.

Debes crear un archivo llamado `.env` dentro de la carpeta `backend/` (es decir, la ruta será `backend/.env`) con el siguiente contenido base:

```env
DB_HOST=db
DB_NAME=db_appvotaciones
DB_USER=user_appvotaciones
DB_PASS=123456
JWT_SECRET="PON_AQUI_TU_SECRET_JWT_O_GENERA_UNO"
```

> **Nota:** El valor de `JWT_SECRET` debe ser una cadena segura y larga (puedes generar una aleatoria o usar cualquier combinación de caracteres segura). En producción, este valor debe mantenerse en secreto.

### 3. Iniciar con Docker (Recomendado)

Desde la raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`), ejecuta el siguiente comando en tu terminal para construir las imágenes y levantar todos los contenedores en segundo plano (Base de Datos, Backend, Frontend y phpMyAdmin):

```bash
docker-compose up -d --build
```

Una vez que termine el proceso, podrás acceder a los diferentes servicios a través de tu navegador:

- **Frontend (Aplicación para usuarios)**: [http://localhost:5173](http://localhost:5173)
- **Backend (API API)**: [http://localhost:8000](http://localhost:8000)
- **Base de datos (phpMyAdmin)**: [http://localhost:8080](http://localhost:8080)

> **Importante:** La base de datos MySQL se inicializará automáticamente gracias a Docker, ejecutando los scripts SQL que se encuentran en la carpeta `backend/database/`. Las credenciales para acceder a phpMyAdmin son las mismas que configuraste en tu `.env` (`user_appvotaciones` / `123456`).

### 4. Modo de Desarrollo Local (Sin Docker)

Si prefieres correr la aplicación en tu máquina local sin usar Docker, puedes utilizar el script `iniciar.bat` ubicado en la raíz del proyecto.

Para que funcione, **asegúrate de tener un servidor MySQL corriendo localmente** con la base de datos configurada, y cambia el valor de `DB_HOST` en el archivo `backend/.env` (de `db` a `localhost` o `127.0.0.1`).

Para iniciar los servidores, simplemente ejecuta:

```bash
iniciar.bat
```

Esto levantará el backend de PHP en el puerto `8000` y el entorno de desarrollo Frontend (Vite) en el puerto `5173`.
