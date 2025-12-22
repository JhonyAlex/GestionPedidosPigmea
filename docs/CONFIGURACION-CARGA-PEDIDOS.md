# 🔧 Configuración de Carga de Pedidos

## 📋 Resumen

El sistema ahora carga **TODOS los pedidos** de forma optimizada usando paginación. 

## ⚙️ Configuración Actual

### Frontend
**Archivo:** `hooks/usePedidosManager.ts`

```typescript
const USE_PAGINATION = true;  // ✅ Activado - carga optimizada
const ITEMS_PER_PAGE = 100;   // Carga 100 pedidos por página
```

**Parámetro clave:**
```typescript
sinFiltroFecha: true  // 🔥 Carga TODOS los pedidos sin restricción de fecha
```

### Backend
**Archivo:** `backend/index.js` (línea ~1882)

El endpoint `/api/pedidos` acepta el parámetro `sinFiltroFecha=true` para cargar todos los pedidos.

**Sin este parámetro:** Solo carga pedidos de los últimos 2 meses (optimización para producción)

## 🎯 Comportamiento Actual

### ✅ Carga Inicial
- **Primera carga:** 100 pedidos (página 1)
- **Tiempo estimado:** ~200-500ms (dependiendo de conexión)
- **Sin filtro de fecha:** Carga desde el pedido más reciente hacia atrás

### ✅ Infinite Scroll (Carga Progresiva)
- Al hacer scroll, carga automáticamente la siguiente página
- **Beneficio:** El usuario no nota lag, ve los pedidos progresivamente
- **WebSockets activos:** Cambios en tiempo real funcionan normalmente

## 📊 Rendimiento Esperado

| Cantidad de Pedidos | Primera Carga | Carga Total | Experiencia Usuario |
|---------------------|---------------|-------------|---------------------|
| 500 pedidos | 100 pedidos (~300ms) | 5 páginas (~1.5s total) | ⭐⭐⭐⭐⭐ Excelente |
| 2000 pedidos | 100 pedidos (~300ms) | 20 páginas (~6s total) | ⭐⭐⭐⭐ Muy Buena |
| 5000 pedidos | 100 pedidos (~300ms) | 50 páginas (~15s total) | ⭐⭐⭐ Buena |

## 🔄 Cómo Funciona

1. **Usuario abre la app**
   - Se cargan los primeros 100 pedidos
   - Usuario puede ver y trabajar inmediatamente

2. **Usuario hace scroll**
   - Se detecta cuando llega al final
   - Se carga automáticamente la siguiente página
   - Se agregan a la lista sin reemplazar los existentes

3. **Actualización en tiempo real**
   - WebSockets notifican cambios
   - Pedidos nuevos se insertan en la lista
   - Pedidos actualizados se sincronizan

## 🛠️ Opciones de Configuración

### Cambiar Tamaño de Página

En `hooks/usePedidosManager.ts`:
```typescript
const ITEMS_PER_PAGE = 100;  // Cambia esto según necesites

// Opciones recomendadas:
// - 50: Para conexiones lentas
// - 100: Balance óptimo (ACTUAL)
// - 200: Para bases de datos grandes y buena conexión
```

### Volver a Modo Legacy (No Recomendado)

Si necesitas cargar TODO de una vez (no paginado):

```typescript
const USE_PAGINATION = false;  // Cargar todo en una sola request
```

**⚠️ Advertencia:** Con 2000+ pedidos, esto puede causar:
- Tiempo de carga inicial de 3-5 segundos
- Uso alto de memoria en el navegador
- Posible lag en la interfaz

### Aplicar Filtro de Fecha (Para Optimizar)

Si solo necesitas pedidos recientes (ej: últimos 3 meses):

En `hooks/usePedidosManager.ts`, cambia:
```typescript
const { pedidos: newPedidos, pagination } = await (store as any).getPaginated({
    page,
    limit: ITEMS_PER_PAGE,
    sinFiltroFecha: false,  // ❌ Desactivar carga completa
    fechaEntregaDesde: '2024-09-01',  // ✅ Fecha específica
});
```

## 🔍 Troubleshooting

### Problema: "No veo todos los pedidos"
**Solución:** Verifica que `sinFiltroFecha: true` esté en `usePedidosManager.ts` línea ~45

### Problema: "La carga inicial es muy lenta"
**Solución:** Reduce `ITEMS_PER_PAGE` a 50 o 25

### Problema: "El scroll infinito no funciona"
**Solución:** Verifica que `hasMore` esté en `true` y que estés usando un componente con scroll

## 📝 Logs de Consola

Cuando el sistema carga pedidos, verás en la consola:

```
📊 [2025-12-22T10:30:45.123Z] Iniciando carga de pedidos (página 1)...
✅ [2025-12-22T10:30:45.456Z] Pedidos cargados (modo paginado):
   - Cargados: 100 pedidos
   - Página: 1/23
   - Total en sistema: 2300
   - Tiempo de carga: 333ms
```

## 🚀 Próximas Mejoras (Futuras)

- [ ] Virtualización de lista (solo renderizar pedidos visibles)
- [ ] Caché local con IndexedDB
- [ ] Prefetch de la siguiente página
- [ ] Filtros avanzados en UI para reducir scope

## 📞 Soporte

Si tienes dudas sobre esta configuración, revisa:
- `docs/PLAN-ESCALABILIDAD.md` - Plan completo de optimización
- `OPTIMIZACION-IMPLEMENTADA.md` - Cambios implementados
- `.github/copilot-instructions.md` - Reglas del proyecto
