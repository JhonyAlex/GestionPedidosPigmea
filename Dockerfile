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

# Copiar código fuente del frontend
COPY src ./src
COPY index.html ./
COPY index.tsx ./
COPY App.tsx ./
COPY public ./public

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

# Volver al directorio raíz
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

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "backend/index.js"]