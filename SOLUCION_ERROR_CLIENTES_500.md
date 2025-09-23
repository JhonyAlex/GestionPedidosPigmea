# SOLUCIÓN ERROR 500 - POST /api/clientes

## 📋 DIAGNÓSTICO DEL PROBLEMA

### ❌ **PROBLEMA IDENTIFICADO:**
Error 500 al crear clientes a través del endpoint `POST /api/clientes` debido a que la columna "cif" no existe en la tabla "clientes".

### 🔍 **CAUSA RAÍZ:**
**Desincronización completa** entre la estructura de la tabla definida en la migración y lo que el código espera:

#### **Estructura en la Migración (001-add-clientes-system.sql):**
```sql
CREATE TABLE clientes (
    id UUID,
    nombre VARCHAR(255),
    contacto_principal VARCHAR(255), -- ❌ El código espera "persona_contacto"
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,                  -- ❌ El código espera "direccion_fiscal"
    comentarios TEXT,                -- ❌ El código espera "notas"
    estado VARCHAR(20)
    -- ❌ FALTAN: cif, codigo_postal, poblacion, provincia, pais
);
```

#### **Estructura que el Código Espera (postgres-client.js:921):**
```sql
INSERT INTO clientes (
    nombre, cif, telefono, email, direccion_fiscal, 
    codigo_postal, poblacion, provincia, pais, 
    persona_contacto, notas, estado
)
```

## ✅ **SOLUCIÓN IMPLEMENTADA**

### 1. **Nueva Migración Creada:** `database/migrations/002-fix-clientes-structure.sql`

Esta migración:
- ✅ Agrega todas las columnas faltantes (`cif`, `direccion_fiscal`, `codigo_postal`, `poblacion`, `provincia`, `pais`, `persona_contacto`, `notas`)
- ✅ Migra datos existentes de columnas similares
- ✅ Actualiza constraints y añade índices
- ✅ Mantiene compatibilidad con datos existentes

### 2. **Script de Aplicación:** `database/apply-clientes-fix.sh`

Script automatizado que:
- 🔍 Verifica la conexión a la base de datos
- 📋 Muestra la estructura actual de la tabla
- 🚀 Aplica la migración de corrección
- ✅ Verifica que todas las columnas requeridas existan

## 🚀 **CÓMO APLICAR LA SOLUCIÓN**

### **Opción A: Ejecutar el Script Automatizado (Recomendado)**

```bash
# Desde la carpeta database/
./apply-clientes-fix.sh
```

### **Opción B: Ejecutar la Migración Manualmente**

```bash
# Con psql (reemplaza con tus datos de conexión)
psql -h localhost -p 5432 -U pigmea_user -d gestion_pedidos -f database/migrations/002-fix-clientes-structure.sql

# O usando DATABASE_URL
psql $DATABASE_URL -f database/migrations/002-fix-clientes-structure.sql
```

### **Opción C: Desde la Aplicación Node.js**

```javascript
// Crear un script temporal en backend/
const { Pool } = require('pg');
const fs = require('fs');

async function applyMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || {
            host: process.env.POSTGRES_HOST,
            port: process.env.POSTGRES_PORT,
            database: process.env.POSTGRES_DB,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD
        }
    });
    
    const migration = fs.readFileSync('./database/migrations/002-fix-clientes-structure.sql', 'utf8');
    
    const client = await pool.connect();
    await client.query(migration);
    client.release();
    await pool.end();
    
    console.log('✅ Migración aplicada exitosamente');
}

applyMigration();
```

## 🔧 **VERIFICACIÓN POST-APLICACIÓN**

Después de aplicar la solución, verifica que funciona:

### 1. **Verificar Estructura de la Tabla**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clientes' AND table_schema = 'public'
ORDER BY ordinal_position;
```

### 2. **Probar el Endpoint**
```bash
curl -X POST http://localhost:3001/api/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nombre": "Cliente de Prueba",
    "cif": "B12345678",
    "telefono": "666777888",
    "email": "test@cliente.com",
    "direccion_fiscal": "Calle Test 123",
    "codigo_postal": "28001",
    "poblacion": "Madrid",
    "provincia": "Madrid",
    "pais": "España",
    "persona_contacto": "Juan Pérez",
    "notas": "Cliente de prueba post-corrección"
  }'
```

### 3. **Verificar en la Aplicación**
- Accede a la sección de Clientes
- Intenta crear un nuevo cliente
- Verifica que no hay más errores 500

## 📊 **COLUMNAS AGREGADAS**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cif` | VARCHAR(20) | Código de Identificación Fiscal |
| `direccion_fiscal` | TEXT | Dirección fiscal completa |
| `codigo_postal` | VARCHAR(10) | Código postal |
| `poblacion` | VARCHAR(100) | Ciudad o población |
| `provincia` | VARCHAR(100) | Provincia |
| `pais` | VARCHAR(100) | País (default: 'España') |
| `persona_contacto` | VARCHAR(255) | Persona de contacto |
| `notas` | TEXT | Notas internas |
| `fecha_baja` | TIMESTAMP | Fecha de baja (soft delete) |

## ⚠️ **CONSIDERACIONES IMPORTANTES**

1. **Backup:** Siempre haz un backup de la base de datos antes de aplicar migraciones
2. **Entorno:** Aplica primero en un entorno de desarrollo/testing
3. **Datos Existentes:** La migración preserva y migra datos existentes automáticamente
4. **Compatibilidad:** Mantiene compatibilidad con las columnas existentes

## 📞 **SI ALGO SALE MAL**

Si después de aplicar la migración sigues teniendo problemas:

1. **Verifica los logs del servidor:**
   ```bash
   # En el backend
   npm run dev
   # Observa los logs cuando intentas crear un cliente
   ```

2. **Revisa la estructura de la tabla:**
   ```sql
   \d clientes  -- En psql
   ```

3. **Verifica permisos:**
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name = 'clientes';
   ```

## 🎉 **RESULTADO ESPERADO**

Después de aplicar esta solución:
- ✅ El endpoint `POST /api/clientes` funcionará sin errores 500
- ✅ Podrás crear clientes con toda la información completa (CIF, dirección fiscal, etc.)
- ✅ Los datos existentes se mantendrán intactos
- ✅ La aplicación funcionará normalmente

---

**Fecha de creación:** 2025-09-23  
**Archivos modificados:** 
- `database/migrations/002-fix-clientes-structure.sql` (nuevo)
- `database/apply-clientes-fix.sh` (nuevo)