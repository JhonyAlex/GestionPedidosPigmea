# ============================================
# STAGE 1: Build Frontend
# ============================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copiar package files del frontend
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Instalar dependencias del frontend (incluyendo devDependencies para el build)
RUN npm ci

# Copiar todo el código fuente del frontend
COPY . ./

# Build del frontend
RUN npm run build

# ============================================
# STAGE 2: Production Image
# ============================================
FROM node:18-alpine

WORKDIR /app

# Instalar PostgreSQL client para migraciones
RUN apk add --no-cache postgresql-client

# Copiar package files del backend
COPY backend/package*.json ./backend/

# Instalar dependencias del backend (solo producción)
WORKDIR /app/backend
RUN npm ci --only=production

# Volver al directorio raíz para copiar, pero luego cambiar a backend para ejecución
WORKDIR /app

# Copiar código del backend
COPY backend ./backend

# Copiar build del frontend desde la etapa anterior
COPY --from=frontend-builder /app/dist ./dist

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Establecer directorio de trabajo en backend para facilitar ejecución
WORKDIR /app/backend

# Exponer puerto estándar
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check (ajustado para localhost:3000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio (ahora estamos en /app/backend)
CMD ["node", "index.js"]