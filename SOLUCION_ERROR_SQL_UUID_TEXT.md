# ✅ Solución: Error SQL "operator does not exist: text = uuid"

## 🔍 Problema Identificado

Al intentar ver las estadísticas de un cliente o cargar sus pedidos, aparecía el siguiente error SQL:

```
Error: operator does not exist: text = uuid
Hint: No operator matches the given name and argument types. 
You might need to add explicit type casts.
```

Esto causaba que:
- ❌ No se cargaban las estadísticas de ningún cliente
- ❌ No se mostraban los pedidos del cliente en el modal de detalles
- ❌ Múltiples errores 500 en las peticiones a `/api/clientes/{id}/estadisticas`

## 🐛 Causa Raíz

El problema estaba en las **consultas SQL de PostgreSQL** que buscaban pedidos por `clienteId`. Las consultas tenían esta estructura:

```sql
WHERE cliente_id = $1 OR data->>'clienteId' = $1
```

El problema es que:
- `cliente_id` es de tipo **UUID** en la tabla
- `data->>'clienteId'` extrae un valor como **TEXT** del JSON
- `$1` es el parámetro que se pasa (un UUID)

PostgreSQL no puede comparar automáticamente `text = uuid` sin un cast explícito, generando el error.

## ✨ Solución Implementada

Se agregó un **cast explícito a texto** (`::text`) en todas las comparaciones con el JSON:

### Cambio 1: `getClienteEstadisticas`
**ANTES:**
```javascript
WHERE cliente_id = $1 OR data->>'clienteId' = $1
```

**DESPUÉS:**
```javascript
WHERE cliente_id = $1 OR data->>'clienteId' = $1::text
```

### Cambio 2: `getClienteHistorialPedidos`
**ANTES:**
```javascript
const countQuery = "SELECT COUNT(*) as total FROM pedidos WHERE cliente_id = $1 OR data->>'clienteId' = $1";
// ...
WHERE cliente_id = $1 OR data->>'clienteId' = $1
```

**DESPUÉS:**
```javascript
const countQuery = "SELECT COUNT(*) as total FROM pedidos WHERE cliente_id = $1 OR data->>'clienteId' = $1::text";
// ...
WHERE cliente_id = $1 OR data->>'clienteId' = $1::text
```

### Cambio 3: `getClientePedidos`
**ANTES:**
```javascript
let whereClause = "WHERE (cliente_id = $1 OR data->>'clienteId' = $1)";
```

**DESPUÉS:**
```javascript
let whereClause = "WHERE (cliente_id = $1 OR data->>'clienteId' = $1::text)";
```

## 🔧 Por Qué Funciona

Al agregar `::text` al parámetro `$1`, le indicamos a PostgreSQL que:
1. Convierta el UUID a texto
2. Compare ese texto con el valor extraído del JSON (que ya es texto)

Esto permite que ambas comparaciones funcionen correctamente:
- `cliente_id = $1` → Compara UUID con UUID ✅
- `data->>'clienteId' = $1::text` → Compara TEXT con TEXT ✅

## 📂 Archivos Modificados

1. ✅ `/workspaces/GestionPedidosPigmea/backend/postgres-client.js`
   - Línea ~1437: `getClienteHistorialPedidos` (2 consultas)
   - Línea ~1466: `getClientePedidos` (1 consulta)
   - Línea ~1543: `getClienteEstadisticas` (1 consulta)

## 🧪 Cómo Verificar la Solución

1. **Reiniciar el backend:**
   ```bash
   cd /workspaces/GestionPedidosPigmea/backend
   # Detener el proceso actual
   lsof -ti:3001 | xargs kill -9
   # Iniciar de nuevo
   npm start
   ```

2. **Probar en el frontend:**
   - Abrir la aplicación
   - Ir a la sección de "Clientes"
   - ✅ Verificar que las tarjetas muestran las estadísticas (pedidos en producción, completados, etc.)
   - Hacer clic en "Ver Detalles" de cualquier cliente
   - ✅ Verificar que se cargan correctamente:
     - Estadísticas del cliente
     - Pedidos en Preparación
     - Pedidos en Producción
     - Pedidos Completados
     - Pedidos Archivados

3. **Verificar en los logs del servidor:**
   - Ya **NO debe aparecer** el error:
     ```
     ❌ error: operator does not exist: text = uuid
     ```

4. **Verificar en la consola del navegador:**
   - Ya **NO deben aparecer** errores 500:
     ```
     ❌ GET /api/clientes/{id}/estadisticas 500 (Internal Server Error)
     ```

## ✅ Resultado Esperado

Después de aplicar estos cambios:
- ✅ Las estadísticas de los clientes se cargan correctamente
- ✅ Los pedidos del cliente se muestran en todas las pestañas
- ✅ No hay errores SQL en el backend
- ✅ No hay errores 500 en el frontend

## 🔗 Soluciones Relacionadas

Esta solución se relaciona con:
1. **`SOLUCION_PEDIDOS_CLIENTE.md`**: Guarda correctamente el `clienteId` al crear pedidos
2. **`SOLUCION_ERROR_AUTENTICACION_CLIENTES.md`**: Usa el servicio correcto para autenticación

Las tres soluciones trabajan juntas para que el flujo completo funcione:
1. ✅ Crear pedido → guarda `clienteId`
2. ✅ Autenticar peticiones → usa headers correctos
3. ✅ Consultar pedidos → usa cast SQL correcto

## 💡 Lecciones Aprendidas

1. **Tipos de datos en PostgreSQL:** Siempre verificar los tipos de datos al hacer comparaciones
2. **JSON en PostgreSQL:** Cuando se extrae un valor de JSON con `->>'`, siempre es `TEXT`
3. **Cast explícito:** Usar `::text`, `::uuid`, `::integer`, etc. para conversiones explícitas
4. **Compatibilidad hacia atrás:** Las consultas usan `OR` para soportar tanto `cliente_id` (nuevo) como `data->>'clienteId'` (antiguo)

## 🔧 Mantenimiento Futuro

Para evitar este tipo de problemas:
- Siempre usar cast explícito cuando se comparen tipos diferentes
- Preferir columnas dedicadas (`cliente_id`) en lugar de valores JSON para relaciones
- Considerar migrar pedidos antiguos para que usen `cliente_id` en lugar de `data->>'clienteId'`
- Documentar los tipos de datos de las columnas importantes
