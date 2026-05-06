
# Paso 1: Construcción (Pesa mucho, pero se descarta)
# Usamos alpine que es la versión más ligera de Node
FROM node:24-alpine AS builder

WORKDIR /app

# Copiamos package.json y lock y usamos 'npm ci' para aprovechar caché
COPY package*.json ./
RUN npm ci

# Copiamos el código fuente y compilamos
COPY . .
RUN npm run build

# Paso 2: Producción (Solo Node + Serve + Archivos compilados)
FROM node:24-alpine

WORKDIR /app

# Instalamos serve de forma global en esta imagen limpia
RUN npm install -g serve

# Copiamos solo la carpeta /dist generada en el paso 1
COPY --from=builder /app/dist ./dist

# Exponemos el puerto que espera Nginx
EXPOSE 3000

# Servimos la web en el puerto 3000 en modo SPA
CMD ["serve", "-s", "dist", "-l", "3000"]