# Etapa 1: Compilar la aplicación React
FROM node:18-alpine AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: Servir los archivos estáticos con Nginx
FROM nginx:stable-alpine

# Copiar los archivos compilados de la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar una configuración personalizada de Nginx si es necesario (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]