# Solución: Vendedores No Guardaban en Mayúsculas

## 🐛 Problema
Al actualizar un vendedor a MAYÚSCULAS, los cambios se mostraban temporalmente pero después de refrescar (F5) volvían a minúsculas.

## 🔍 Diagnóstico

### 1. Verificación de WebSockets
- ✅ Los eventos WebSocket funcionaban correctamente
- ✅ El frontend recibía y mostraba el cambio
- ❌ Después de F5, los datos volvían al estado anterior

### 2. Verificación de Base de Datos
```bash
# Consulta directa en PostgreSQL
SELECT nombre FROM limpio.vendedores WHERE id = '...';
# Resultado: "Maprisalinas" (formato título)
```

### 3. Análisis de Logs del Backend
Agregué logs detallados en `postgres-client.js` y descubrí:

```javascript
✅ UPDATE ejecutado, filas afectadas: 1
✅ Vendedor devuelto por BD: { nombre: 'MAPRISALINAS' }  // ✅ Correcto
💾 Haciendo COMMIT de la transacción...
⚠️ Error actualizando columna legacy vendedor: invalid input syntax for type uuid: ""
✅ COMMIT exitoso
🔍 Verificación post-COMMIT - Nombre en BD: Maprisalinas  // ❌ ¡Volvió a minúsculas!
```

### 4. Causa Raíz Identificada
En `postgres-client.js`, línea 1914:

```javascript
WHERE (vendedor_id IS NULL OR vendedor_id = '')  // ❌ ERROR AQUÍ
```

**Problema:** Comparar una columna UUID con string vacío `''` genera error en PostgreSQL:
- Error: `invalid input syntax for type uuid: ""`
- Esto **invalida toda la transacción**
- El `COMMIT` falla silenciosamente (se convierte en ROLLBACK automático)
- Todos los cambios se pierden

## ✅ Solución

**Archivo:** `backend/postgres-client.js`

```javascript
// ❌ ANTES (línea 1914)
WHERE (vendedor_id IS NULL OR vendedor_id = '')

// ✅ DESPUÉS
WHERE vendedor_id IS NULL
```

**Cambios adicionales:**
- Agregado log del código de error para debug futuro
- El `try-catch` ahora no propaga el error

## 🎯 Resultado
- ✅ El UPDATE se guarda correctamente en BD
- ✅ El COMMIT es exitoso
- ✅ Los nombres en MAYÚSCULAS se mantienen después de F5
- ✅ No hay más ROLLBACK silencioso

## 📝 Lecciones Aprendidas
1. **Los errores en try-catch pueden invalidar transacciones** aunque el código continúe
2. **Nunca comparar UUIDs con strings vacíos**, usar `IS NULL`
3. **Siempre verificar el estado real de la BD post-COMMIT** en operaciones críticas
4. **Logs detallados son esenciales** para identificar problemas de transacciones

---
**Fecha:** 2026-02-02  
**Commit:** `46d3148`
