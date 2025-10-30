# Pasos para Desplegar el Campo Vendedor

## ✅ Problemas Resueltos

1. **Error de índice GIN en PostgreSQL**: Corregido (índice problemático deshabilitado)
2. **Métodos faltantes en postgres-client.js**: Agregados todos los métodos CRUD para vendedores

## 🚀 Pasos para Aplicar los Cambios

### 1. Reiniciar el Backend

El error `ERR_CONNECTION_REFUSED` indica que el backend no está corriendo. Necesitas reiniciarlo:

**Si usas PM2:**
```bash
pm2 restart backend
# o
pm2 restart all
```

**Si usas Node directamente:**
```bash
cd backend
node index.js
```

**Si usas Docker:**
```bash
docker-compose restart backend
# o
docker restart <nombre-contenedor-backend>
```

### 2. Verificar que el Backend Está Corriendo

Abre tu navegador o usa curl:
```bash
curl http://localhost:3001/api/vendedores
```

Deberías ver una respuesta JSON (puede ser un array vacío `[]` si no hay vendedores todavía).

### 3. Aplicar la Migración de Base de Datos

Una vez que el backend esté corriendo, ejecuta la migración:

**Opción A - Desde el frontend (recomendado):**
1. Inicia sesión como administrador
2. Ve a la consola del navegador
3. Ejecuta:
```javascript
fetch('http://localhost:3001/api/admin/migrate', {
    method: 'POST',
    credentials: 'include'
}).then(r => r.json()).then(console.log)
```

**Opción B - Con curl:**
```bash
curl -X POST http://localhost:3001/api/admin/migrate \
  -H "Content-Type: application/json" \
  --cookie "tu-cookie-de-sesion"
```

**Opción C - Desde pgAdmin o psql:**
```sql
-- Crear tabla vendedores
CREATE TABLE IF NOT EXISTS vendedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columna vendedor a pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS vendedor VARCHAR(255);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_vendedores_nombre ON vendedores(nombre);
CREATE INDEX IF NOT EXISTS idx_vendedores_activo ON vendedores(activo);
CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor ON pedidos(vendedor);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vendedores_updated_at ON vendedores;
CREATE TRIGGER update_vendedores_updated_at 
    BEFORE UPDATE ON vendedores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Recargar el Frontend

Una vez que el backend esté funcionando:
1. Recarga la página del navegador (F5)
2. Los selectores de vendedor deberían funcionar correctamente

## 🧪 Pruebas para Verificar

### Test 1: Listar Vendedores
```bash
curl http://localhost:3001/api/vendedores
```
Esperado: `[]` o lista de vendedores

### Test 2: Crear Vendedor
```bash
curl -X POST http://localhost:3001/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Pérez", "email": "juan@example.com"}'
```
Esperado: Objeto JSON del vendedor creado

### Test 3: Ver Vendedores en Frontend
1. Abre el modal "Crear Nuevo Pedido"
2. Busca el campo "Vendedor" al lado de "Fecha de Entrega"
3. El select debería mostrar la opción "-- Crear nuevo vendedor --"

## 📋 Checklist de Verificación

- [ ] Backend está corriendo (puerto 3001 accesible)
- [ ] Migración de BD ejecutada sin errores
- [ ] Tabla `vendedores` existe en PostgreSQL
- [ ] Columna `vendedor` existe en tabla `pedidos`
- [ ] GET `/api/vendedores` responde correctamente
- [ ] POST `/api/vendedores` funciona
- [ ] Frontend muestra el campo "Vendedor" en los modales
- [ ] Se puede crear un vendedor desde el modal
- [ ] El vendedor creado aparece en la lista

## 🔧 Solución de Problemas Comunes

### Error: "ERR_CONNECTION_REFUSED"
**Causa**: El backend no está corriendo
**Solución**: Reinicia el backend con los comandos del paso 1

### Error: "relation 'vendedores' does not exist"
**Causa**: La tabla no se ha creado
**Solución**: Ejecuta la migración (paso 3)

### Error: "column 'vendedor' does not exist"
**Causa**: La columna no se ha agregado a pedidos
**Solución**: Ejecuta la migración SQL del paso 3 opción C

### Error: "syntax error at or near SELECT" (logs de PostgreSQL)
**Causa**: Índice GIN problemático
**Solución**: ✅ Ya resuelto en el código, se deshabilitó el índice problemático

### El campo no aparece en el modal
**Causa**: Frontend no recargado o código antiguo en caché
**Solución**: 
1. Limpia caché del navegador (Ctrl+Shift+Del)
2. Recarga con Ctrl+F5
3. Reconstruye el frontend si usas build

## 📞 Si Necesitas Ayuda

Si después de seguir estos pasos aún tienes problemas:

1. **Verifica los logs del backend**: Busca mensajes de error al iniciar
2. **Verifica los logs de PostgreSQL**: Busca errores de SQL
3. **Verifica la consola del navegador**: Busca errores de red o JavaScript
4. **Comparte los logs completos** para diagnóstico más específico

## 🎉 Éxito

Cuando todo funcione correctamente:
- ✅ Podrás ver el campo "Vendedor" en los modales
- ✅ Podrás crear vendedores sin salir del modal
- ✅ Los vendedores se sincronizarán en tiempo real
- ✅ Los pedidos se guardarán con el vendedor asignado
