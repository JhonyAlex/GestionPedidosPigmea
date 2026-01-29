# ============================================
# GUÍA DE DESPLIEGUE PRODUCTION-READY
# Sistema de Gestión de Pedidos Pigmea
# ============================================

## 📋 Resumen de Cambios

Se ha implementado un sistema completo de migraciones automáticas y configuración production-ready:

### ✅ Nuevos Archivos
- `backend/migrations.js` - Sistema automático de migraciones
- `Dockerfile` - Imagen Docker optimizada multi-stage
- `.dockerignore` - Optimización de build

### ✅ Archivos Modificados
- `backend/index.js` - Integración del nuevo sistema de migraciones
- `backend/postgres-client.js` - Uso consistente del esquema `limpio`

### ❌ Archivos Obsoletos (ya no se usan)
- `backend/run-migrations.sh` - Reemplazado por sistema Node.js

---

## 🚀 DESPLIEGUE EN DOKPLOY

### Paso 1: Configurar Variables de Entorno en Dokploy

En tu proyecto de Dokploy, configura estas variables:

```env
NODE_ENV=production
PORT=3001
TRUST_PROXY=1

# Base de datos (Dokploy las configura automáticamente si usas su PostgreSQL)
DATABASE_URL=postgresql://usuario:contraseña@host:5432/nombre_bd

# JWT (genera uno nuevo con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=tu_secreto_jwt_muy_largo_y_seguro_aqui

# CORS (tu dominio de producción)
ALLOWED_ORIGINS=https://planning.pigmea.click,https://www.planning.pigmea.click
```

### Paso 2: Configurar el Build en Dokploy

1. **Build Method**: Dockerfile
2. **Dockerfile Path**: `./Dockerfile`
3. **Build Context**: `.` (raíz del proyecto)
4. **Port**: 3001

### Paso 3: Conectar Base de Datos PostgreSQL

Si usas la base de datos de Dokploy:
- Dokploy automáticamente inyectará `DATABASE_URL`
- No necesitas configurar nada más

Si usas una base de datos externa:
- Configura `DATABASE_URL` manualmente en las variables de entorno

### Paso 4: Desplegar

1. Haz commit de todos los cambios:
```bash
git add .
git commit -m "feat: sistema de migraciones automáticas production-ready"
git push
```

2. En Dokploy:
   - Ve a tu aplicación
   - Click en "Deploy"
   - Espera a que el build termine

### Paso 5: Verificar

Una vez desplegado, verifica:

1. **Health Check**: `https://planning.pigmea.click/api/health`
   - Debe retornar `{"status":"ok"}`

2. **Logs de Migraciones**: En Dokploy → Logs, busca:
   ```
   ✅ Base de datos actualizada. No hay migraciones pendientes.
   ```
   O:
   ```
   ✅ Proceso de migraciones completado. X migraciones procesadas.
   ```

3. **Funcionalidad**: Prueba crear/editar un pedido

---

## 🔧 DESARROLLO LOCAL

### Requisitos
- Node.js 18+
- PostgreSQL 14+

### Setup

1. **Instalar dependencias**:
```bash
npm install
cd backend && npm install && cd ..
```

2. **Configurar `.env` local**:
```bash
# Crear backend/.env
DATABASE_URL=postgresql://pigmea_user:tu_password@localhost:5432/gestion_pedidos
JWT_SECRET=desarrollo_secreto_no_usar_en_produccion
NODE_ENV=development
```

3. **Iniciar base de datos local**:
```bash
# Si usas Docker para PostgreSQL local
docker run --name postgres-pigmea -e POSTGRES_PASSWORD=tu_password -e POSTGRES_USER=pigmea_user -e POSTGRES_DB=gestion_pedidos -p 5432:5432 -d postgres:14
```

4. **Iniciar desarrollo**:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && node index.js
```

Las migraciones se ejecutarán automáticamente al iniciar el backend.

---

## 📊 SISTEMA DE MIGRACIONES

### Cómo Funciona

1. Al iniciar el servidor, `MigrationManager` verifica qué migraciones faltan
2. Ejecuta solo las migraciones pendientes
3. Registra cada migración en `limpio.migrations`
4. Si una migración falla, continúa con las siguientes (no detiene el servidor)

### Migraciones Incluidas

1. **001-nueva-fecha-entrega**: Campo `nueva_fecha_entrega`
2. **002-numeros-compra**: Campo `numeros_compra` (JSONB)
3. **003-vendedor**: Campo `vendedor`
4. **004-anonimo**: Campo `anonimo`
5. **005-fechas-cliche**: Campos `compra_cliche` y `recepcion_cliche`
6. **006-horas-confirmadas**: Campo `horas_confirmadas`
7. **007-antivaho-realizado**: Campo `antivaho_realizado`
8. **008-menciones-comentarios**: Sistema de menciones en comentarios

### Agregar Nueva Migración

Edita `backend/migrations.js` y agrega al array `this.migrations`:

```javascript
this.migrations.push({
    id: '009-mi-nueva-migracion',
    name: 'Descripción de la migración',
    sql: `
        DO $$ 
        BEGIN
            -- Tu SQL aquí
        END $$;
    `
});
```

---

## 🛡️ SEGURIDAD

### Implementado
- ✅ Usuario no-root en Docker
- ✅ Health checks automáticos
- ✅ Rate limiting en endpoints críticos
- ✅ Helmet.js para headers de seguridad
- ✅ CORS configurado por dominio
- ✅ JWT con expiración
- ✅ Validación de permisos por rol

### Recomendaciones Adicionales
- Rotar `JWT_SECRET` periódicamente
- Configurar backups automáticos de PostgreSQL en Dokploy
- Monitorear logs de errores

---

## 🐛 TROUBLESHOOTING

### Error: "Connection refused" al desplegar
**Causa**: La base de datos no está lista cuando el servidor inicia.
**Solución**: El sistema reintenta automáticamente. Espera 30-60 segundos.

### Error: "Migración X falló"
**Causa**: Conflicto con datos existentes o permisos.
**Solución**: 
1. Revisa los logs completos en Dokploy
2. Conéctate a la BD y ejecuta manualmente la migración
3. El servidor continuará funcionando con las migraciones que sí aplicaron

### Error: "Cannot find module 'migrations'"
**Causa**: El archivo `backend/migrations.js` no se copió al contenedor.
**Solución**: Verifica que `.dockerignore` no esté excluyendo archivos `.js`

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisa los logs en Dokploy → Tu App → Logs
2. Verifica las variables de entorno
3. Comprueba que `DATABASE_URL` sea accesible desde el contenedor

---

**Última actualización**: 2026-01-29
**Versión**: 2.0.0 (Production-Ready)
