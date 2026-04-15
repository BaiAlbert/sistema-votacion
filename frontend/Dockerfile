FROM node:24-bookworm-slim

WORKDIR /app

# Copiar configuración e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar la aplicación Vite para producción (crea la carpeta /dist)
RUN npm run build

# Instalar 'serve', un servidor estático ligero de Node.js
RUN npm install -g serve

# Exponer el puerto 3000
EXPOSE 3000

# El comando que mantendrá el contenedor vivo sirviendo la carpeta compilada
CMD ["serve", "-s", "dist", "-l", "3000"]