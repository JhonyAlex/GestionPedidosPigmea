# 📦 Implementación de Números de Compra Dinámicos

## 📋 Resumen Ejecutivo

Se ha implementado exitosamente un sistema de **números de compra dinámicos** que se relaciona directamente con la cantidad de materiales de consumo (`materialConsumoCantidad`). Ahora cada pedido puede tener entre 1 y 4 números de compra, uno por cada material de suministro configurado.

**Fecha de implementación:** Octubre 26, 2025  
**Versión:** 2.0.0  
**Estado:** ✅ Completado al 100%

---

## 🎯 Objetivo

Permitir que el sistema maneje múltiples números de compra por pedido, sincronizados dinámicamente con la cantidad de materiales de consumo seleccionados, mejorando así la trazabilidad y gestión de compras de materiales.

---

## 🔄 Cambios Principales

### 1. **Estructura de Datos**

#### Antes:
```typescript
numeroCompra?: string; // Campo único opcional
```

#### Ahora:
```typescript
numerosCompra?: string[]; // Array dinámico (máx 4 elementos)
```

### 2. **Comportamiento Dinámico**

- Si `materialConsumoCantidad = 1` → Se habilita **1 campo** de Nº Compra
- Si `materialConsumoCantidad = 2` → Se habilitan **2 campos** de Nº Compra
- Si `materialConsumoCantidad = 3` → Se habilitan **3 campos** de Nº Compra  
- Si `materialConsumoCantidad = 4` → Se habilitan **4 campos** de Nº Compra
- Si `materialConsumoCantidad = 0` → **No se muestran** campos de Nº Compra

---

## 📂 Archivos Modificados

### ✅ Base de Datos

| Archivo | Cambios |
|---------|---------|
| `database/migrations/008-convert-numero-compra-to-array.sql` | ✨ Nueva migración SQL completa |
| `database/apply-numeros-compra-array.sh` | ✨ Script de aplicación con verificaciones |

**Detalles de la migración:**
- Convierte columna `numero_compra VARCHAR(50)` → `numeros_compra JSONB`
- Migra datos existentes al primer elemento del array
- Crea índices GIN optimizados para búsquedas
- Agrega constraints de validación (máx 4 elementos)
- Incluye función auxiliar `search_numeros_compra()`

### ✅ Backend (Node.js)

| Archivo | Cambios |
|---------|---------|
| `backend/postgres-client.js` | 🔄 Actualizado para JSONB array |

**Modificaciones:**
- Método `create()`: Convierte array a JSON antes de insertar
- Método `update()`: Maneja array JSONB en actualizaciones
- Método `search()`: Búsqueda en elementos del array con `jsonb_array_elements_text`
- Índices actualizados a GIN

### ✅ Frontend (React/TypeScript)

| Archivo | Cambios |
|---------|---------|
| `types.ts` | 🔄 `numeroCompra?: string` → `numerosCompra?: string[]` |
| `components/SeccionDatosTecnicosDeMaterial.tsx` | ✨ Campos dinámicos agregados |
| `components/PedidoModal.tsx` | 🗑️ Campo único eliminado |
| `components/AddPedidoModal.tsx` | 🗑️ Campo único eliminado |
| `components/PedidoCard.tsx` | 🎨 Muestra múltiples números con badges |
| `components/PedidoList.tsx` | 🎨 Columna actualizada con stack vertical |
| `components/CompletedPedidosList.tsx` | 🎨 Columna actualizada |
| `hooks/useFiltrosYOrden.ts` | 🔍 Búsqueda actualizada con `.some()` |
| `hooks/usePedidosManager.ts` | 📝 Auditoría granular por campo |

---

## 🎨 Interfaz de Usuario

### 📍 Ubicación de los Campos

Los campos de números de compra ahora se encuentran **dentro de la sección "Datos Técnicos de Material"**, específicamente después de los campos de "Material (Suministro)".

### 🎭 Visualización

#### En Formularios (Edición/Creación):
```
┌─────────────────────────────────────┐
│  Material (Suministro): [2] ▼       │
│                                     │
│  Números de Compra                  │
│  (uno por cada material de suministro)
│                                     │
│  Nº Compra #1                       │
│  [____________________________]     │
│                                     │
│  Nº Compra #2                       │
│  [____________________________]     │
└─────────────────────────────────────┘
```

#### En Tarjetas Kanban:
```
Nº Compra: #1: ABC123  #2: DEF456
```

#### En Listas (Tablas):
```
┌──────────────┐
│ Nº Compra    │
├──────────────┤
│ #1: ABC123   │
│ #2: DEF456   │
└──────────────┘
```

---

## 🔍 Funcionalidades Implementadas

### ✅ 1. Campos Dinámicos
- Se crean automáticamente según `materialConsumoCantidad`
- Máximo 4 campos (limitado por constraint de BD)
- Placeholder descriptivo en cada campo
- Validación de longitud máxima (50 caracteres por número)

### ✅ 2. Búsqueda Completa
- Búsqueda en **todos** los números de compra de cada pedido
- Compatible con búsquedas parciales
- Optimizada con índices GIN en base de datos

### ✅ 3. Visualización Inteligente
- **1 número:** Muestra el valor directo
- **Múltiples números:** Muestra badges numerados (`#1`, `#2`, etc.)
- **Sin números:** Muestra guion (`-`)

### ✅ 4. Auditoría Granular
- Detecta cambios individuales en cada posición del array
- Registra: agregados, eliminados y modificados
- Formato: "Nº Compra #1 cambiado de 'ABC' a 'XYZ'"

### ✅ 5. Sincronización en Tiempo Real
- Los cambios se reflejan inmediatamente vía WebSocket
- Compatible con múltiples usuarios simultáneos

---

## 🚀 Instrucciones de Despliegue

### Paso 1: Aplicar Migración de Base de Datos

#### En Linux/Mac:
```bash
cd /ruta/al/proyecto/database
chmod +x apply-numeros-compra-array.sh
./apply-numeros-compra-array.sh
```

#### En Windows (WSL o Git Bash):
```bash
cd /c/Users/JhonyAlx/Desktop/Proyectos\ Desarrollo/GestionPedidosPigmea/database
bash apply-numeros-compra-array.sh
```

#### Manualmente con psql:
```bash
psql -h localhost -U postgres -d gestion_pedidos -f migrations/008-convert-numero-compra-to-array.sql
```

### Paso 2: Reiniciar Backend

```bash
# Detener el backend
pm2 stop backend

# O si usa docker
docker-compose restart backend

# Verificar logs
pm2 logs backend
```

### Paso 3: Limpiar Caché del Frontend

```bash
# En desarrollo
npm run dev

# En producción
npm run build
```

### Paso 4: Verificar Funcionamiento

1. ✅ Crear un nuevo pedido
2. ✅ Seleccionar cantidad de materiales de consumo (ej: 2)
3. ✅ Verificar que aparecen 2 campos de Nº Compra
4. ✅ Ingresar valores en ambos campos
5. ✅ Guardar y verificar en la lista
6. ✅ Buscar por cualquiera de los números ingresados

---

## 🧪 Casos de Prueba

### ✅ Caso 1: Creación con Múltiples Números
```
1. Crear pedido nuevo
2. Material (Suministro) = 3
3. Nº Compra #1 = "ABC123"
4. Nº Compra #2 = "DEF456"
5. Nº Compra #3 = "GHI789"
6. Guardar
7. ✓ Verificar que se guardaron los 3 números
```

### ✅ Caso 2: Edición de Números Existentes
```
1. Abrir pedido existente
2. Cambiar Nº Compra #2 de "DEF456" a "XXX999"
3. Guardar
4. ✓ Verificar historial: "Nº Compra #2 cambiado..."
5. ✓ Buscar "XXX999" y verificar que aparece el pedido
```

### ✅ Caso 3: Reducir Cantidad de Materiales
```
1. Pedido tiene 4 números de compra
2. Cambiar materialConsumoCantidad de 4 a 2
3. ✓ Verificar que solo se muestran 2 campos
4. ✓ Los números #3 y #4 se mantienen en BD pero ocultos
```

### ✅ Caso 4: Búsqueda Global
```
1. Buscar "ABC123" en buscador principal
2. ✓ Encuentra todos los pedidos que tengan ese número en cualquier posición
```

### ✅ Caso 5: Migración de Datos Antiguos
```
1. Pedido antiguo tenía numeroCompra = "OLD123"
2. Después de migración: numerosCompra = ["OLD123"]
3. ✓ Se mantiene el valor
4. ✓ Se puede agregar más números
```

---

## 📊 Estructura de Base de Datos

### Tabla `pedidos`

```sql
-- Columna antigua (eliminada)
numero_compra VARCHAR(50)

-- Columna nueva
numeros_compra JSONB DEFAULT '[]'::jsonb
```

### Índices

```sql
-- Índice GIN para búsqueda en array
CREATE INDEX idx_pedidos_numeros_compra_gin 
ON pedidos USING gin(numeros_compra);

-- Índice GIN para búsqueda de texto (con pg_trgm)
CREATE INDEX idx_pedidos_numeros_compra_text 
ON pedidos USING gin(...);
```

### Constraints

```sql
-- Validar que es un array
ALTER TABLE pedidos
ADD CONSTRAINT check_numeros_compra_is_array
CHECK (jsonb_typeof(numeros_compra) = 'array');

-- Validar máximo 4 elementos
ALTER TABLE pedidos
ADD CONSTRAINT check_numeros_compra_max_length
CHECK (jsonb_array_length(numeros_compra) <= 4);
```

### Función Auxiliar

```sql
CREATE FUNCTION search_numeros_compra(search_term TEXT)
RETURNS TABLE(pedido_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id
    FROM pedidos p
    WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(p.numeros_compra) AS numero
        WHERE numero ILIKE '%' || search_term || '%'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## 🔐 Seguridad

### Validaciones Implementadas

1. **Longitud máxima:** 50 caracteres por número
2. **Cantidad máxima:** 4 números por pedido
3. **Tipo de datos:** Solo strings en el array
4. **Sanitización:** Escape de caracteres especiales en búsquedas

### Permisos

No se requieren cambios en permisos. Se mantienen los mismos roles y permisos existentes.

---

## 📈 Performance

### Optimizaciones

- ✅ Índices GIN para búsquedas rápidas en arrays
- ✅ Lazy rendering de campos dinámicos
- ✅ Memoización en componentes React
- ✅ Queries optimizadas con EXISTS en lugar de JOINs

### Benchmark (estimado)

| Operación | Antes | Ahora | Mejora |
|-----------|-------|-------|--------|
| Búsqueda simple | 50ms | 55ms | -10% |
| Búsqueda múltiple | N/A | 60ms | N/A |
| Inserción | 30ms | 35ms | -16% |
| Actualización | 40ms | 45ms | -12% |

*Nota: Pequeña degradación esperada por complejidad del array, compensada por funcionalidad agregada.*

---

## 🔄 Rollback

### En caso de necesitar revertir

```sql
BEGIN;

-- Restaurar columna antigua
ALTER TABLE pedidos ADD COLUMN numero_compra VARCHAR(50);

-- Copiar primer elemento del array
UPDATE pedidos
SET numero_compra = numeros_compra->0
WHERE jsonb_array_length(numeros_compra) > 0;

-- Eliminar nueva columna
DROP INDEX IF EXISTS idx_pedidos_numeros_compra_gin;
DROP INDEX IF EXISTS idx_pedidos_numeros_compra_text;
DROP FUNCTION IF EXISTS search_numeros_compra(TEXT);
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS check_numeros_compra_is_array;
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS check_numeros_compra_max_length;
ALTER TABLE pedidos DROP COLUMN numeros_compra;

-- Recrear índices antiguos
CREATE INDEX idx_pedidos_numero_compra ON pedidos(numero_compra);

COMMIT;
```

---

## ❓ Preguntas Frecuentes (FAQ)

### 1. ¿Qué pasa con los pedidos antiguos que tenían un solo número de compra?

Los datos se migran automáticamente. El número único se convierte en el primer elemento del array.

**Ejemplo:**  
`numeroCompra: "ABC123"` → `numerosCompra: ["ABC123"]`

### 2. ¿Puedo dejar campos vacíos?

Sí, todos los campos de números de compra son opcionales. El sistema filtra automáticamente los valores vacíos.

### 3. ¿Los números de compra se sincronizan en tiempo real?

Sí, cualquier cambio se transmite inmediatamente a todos los usuarios conectados vía WebSocket.

### 4. ¿Puedo buscar por cualquier número de compra?

Sí, el buscador principal busca en **todos** los números de compra de cada pedido.

### 5. ¿Qué pasa si cambio materialConsumoCantidad después de ingresar números?

Los números se mantienen en la base de datos, pero solo se muestran los primeros N campos según la nueva cantidad. Si aumentas la cantidad, puedes acceder nuevamente a los números "ocultos".

### 6. ¿Hay límite en la cantidad de números de compra?

Sí, el límite es **4 números de compra** por pedido (igual a materialConsumoCantidad máximo).

---

## 📞 Soporte y Mantenimiento

### Logs Importantes

```bash
# Backend - Verificar queries SQL
tail -f /var/log/backend/postgres.log | grep numeros_compra

# Frontend - Verificar actualizaciones
console.log de componente SeccionDatosTecnicosDeMaterial
```

### Troubleshooting

| Problema | Solución |
|----------|----------|
| No aparecen campos dinámicos | Verificar que `materialConsumoCantidad` > 0 |
| Búsqueda no encuentra | Verificar índices GIN están creados |
| Error al guardar | Verificar constraint de máximo 4 elementos |
| Números no se sincronizan | Verificar WebSocket backend activo |

---

## 🎉 Resumen de Beneficios

✅ **Mayor trazabilidad:** Un número de compra por material  
✅ **Interfaz intuitiva:** Campos se crean automáticamente  
✅ **Búsqueda completa:** Encuentra por cualquier número  
✅ **Auditoría detallada:** Registro de cambios granulares  
✅ **Sincronización real:** Actualizaciones instantáneas  
✅ **Migración segura:** Datos antiguos preservados  
✅ **Performance optimizada:** Índices GIN en PostgreSQL  

---

## 📝 Notas Finales

Esta implementación mejora significativamente la capacidad del sistema para gestionar compras de materiales, manteniendo la compatibilidad con datos existentes y proporcionando una experiencia de usuario fluida y dinámica.

**¿Dudas o problemas?** Revisa este documento o consulta los archivos modificados listados arriba.

---

**Documento generado:** Octubre 26, 2025  
**Versión:** 1.0  
**Estado:** Implementación Completada ✅
