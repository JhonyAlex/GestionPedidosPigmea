# 🚀 Guía de Implementación - Optimización de Rendimiento

## 📌 Resumen

He implementado las **bases críticas** para escalar el sistema a 2000+ pedidos. Ahora tienes:

✅ **Migración 022:** Campo `estado` para clasificar pedidos (ACTIVO/INACTIVO/ARCHIVADO)
✅ **Migración 023:** Índices de base de datos para búsquedas rápidas
✅ **Script de Archivado:** Automatización para marcar pedidos antiguos como INACTIVO

---

## 🎯 Fase 1: Ejecutar Migraciones (HACER AHORA)

### 1. Aplicar las nuevas migraciones

```bash
cd /workspaces/GestionPedidosPigmea/backend
./run-migrations.sh
```

**Esto creará:**
- Campo `estado` en tabla `pedidos`
- 9 índices optimizados para consultas rápidas
- Marcará automáticamente pedidos antiguos como INACTIVO

**Resultado esperado:**
```
✅ Migración 'Agregar Campo Estado para Archivado' aplicada exitosamente.
✅ Migración 'Agregar Índices de Rendimiento' aplicada exitosamente.
```

---

### 2. Verificar que las migraciones funcionaron

```bash
# Conectar a PostgreSQL
psql $DATABASE_URL

# Verificar columna estado
\d pedidos

# Verificar índices creados
\di pedidos*

# Verificar pedidos INACTIVO
SELECT estado, COUNT(*) FROM pedidos GROUP BY estado;
```

**Deberías ver:**
- Columna `estado` en la tabla `pedidos`
- Índices con nombres como `idx_pedidos_estado`, `idx_pedidos_numero_cliente`, etc.
- Conteo de pedidos por estado

---

### 3. Probar el script de archivado automático

```bash
cd /workspaces/GestionPedidosPigmea/backend
node scripts/auto-archive-old-pedidos.js
```

**Esto mostrará:**
- Lista de pedidos completados hace >2 meses
- Los marcará como INACTIVO automáticamente

**Salida esperada:**
```
🗄️ Iniciando proceso de archivado automático...
📅 Fecha límite: 2025-09-06
🔍 Se encontraron 15 pedidos para archivar:
   1. Pedido #12345 | Entrega: 2025-07-15 | ID: abc123
   ...
✅ 15 pedidos archivados exitosamente.
```

---

## 🔧 Fase 2: Optimizar Backend (PENDIENTE)

Ahora necesitas modificar el backend para usar paginación. He creado el código completo en `docs/PLAN-ESCALABILIDAD.md`.

### Cambios en `backend/postgres-client.js`

**Agregar método `getAllPaginated()`:**

```javascript
async getAllPaginated(options = {}) {
    // Ver código completo en docs/PLAN-ESCALABILIDAD.md
    // Sección "SOLUCIÓN 1: Paginación + Filtro por Fecha"
}
```

### Cambios en `backend/index.js`

**Reemplazar endpoint `/api/pedidos`:**

```javascript
app.get('/api/pedidos', async (req, res) => {
    // Ver código completo en docs/PLAN-ESCALABILIDAD.md
    // Usa getAllPaginated() en lugar de getAll()
}
```

---

## 🎨 Fase 3: Adaptar Frontend (PENDIENTE)

### Cambios en `services/storage.ts`

**Agregar método `getPaginated()`:**

```typescript
async getPaginated(options: PaginationOptions = {}, authHeaders: any = {}): Promise<PaginatedResponse> {
    // Ver código completo en docs/PLAN-ESCALABILIDAD.md
}
```

### Cambios en `hooks/usePedidosManager.ts`

**Usar paginación en lugar de carga completa:**

```typescript
// ANTES (carga todo)
const currentPedidos = await store.getAll();

// DESPUÉS (carga últimos 2 meses)
const result = await store.getPaginated({ page: 1, limit: 100 });
setPedidos(result.pedidos);
```

---

## 🤖 Fase 4: Automatización (OPCIONAL)

### Configurar Cron Job para archivado automático

Si estás en Linux/Docker:

```bash
# Editar crontab
crontab -e

# Agregar línea (ejecuta diariamente a las 3:00 AM)
0 3 * * * cd /workspaces/GestionPedidosPigmea/backend && node scripts/auto-archive-old-pedidos.js >> /var/log/auto-archive.log 2>&1
```

---

## 📊 Resultados Esperados

### Antes de la optimización:
- **Carga inicial:** 5-10 segundos (con 2000 pedidos)
- **Datos transferidos:** ~1-2 MB
- **Memoria RAM:** ~300-500 MB
- **Experiencia:** Lenta, navegador bloqueado

### Después de la optimización:
- **Carga inicial:** 0.5-1 segundo
- **Datos transferidos:** ~100-200 KB (solo últimos 2 meses)
- **Memoria RAM:** ~50-80 MB
- **Experiencia:** Rápida, fluida, sin bloqueos

---

## 🧪 Cómo Probar el Sistema

### 1. Sin Paginación (Estado Actual)

```bash
curl "http://localhost:8080/api/pedidos" | jq '. | length'
# Devuelve TODOS los pedidos (ej: 2000)
```

### 2. Con Paginación (Después de implementar)

```bash
# Solo primeros 100
curl "http://localhost:8080/api/pedidos?page=1&limit=100" | jq '.pagination'

# Solo últimos 2 meses
curl "http://localhost:8080/api/pedidos?fechaEntregaDesde=2025-09-01" | jq '.pedidos | length'

# Excluir archivados e inactivos
curl "http://localhost:8080/api/pedidos?incluirArchivados=false&incluirCompletados=false" | jq '.pedidos | length'
```

---

## ⚠️ Consideraciones Importantes

1. **Compatibilidad:** El método `store.getAll()` sigue funcionando (pero marcado como deprecated)
2. **Búsqueda:** Los pedidos INACTIVO no se mostrarán por defecto, pero SÍ aparecen en búsquedas/filtros
3. **Migración gradual:** Puedes implementar backend primero y frontend después sin romper nada

---

## 📚 Documentos de Referencia

- **Plan Completo:** `docs/PLAN-ESCALABILIDAD.md`
- **Migraciones:** `database/migrations/022-*.sql` y `023-*.sql`
- **Script de Archivado:** `backend/scripts/auto-archive-old-pedidos.js`

---

## 🆘 Troubleshooting

### Error: "column estado does not exist"
**Solución:** Ejecutar `./run-migrations.sh` en el backend

### Error: "relation idx_pedidos_estado does not exist"
**Solución:** Verificar que la migración 023 se ejecutó correctamente

### Pedidos antiguos siguen cargándose
**Solución:** 
1. Ejecutar `node scripts/auto-archive-old-pedidos.js`
2. Verificar que el backend use `getAllPaginated()` en lugar de `getAll()`

### Rendimiento no mejora
**Solución:** Verificar que el frontend use `store.getPaginated()` con límites de fecha

---

## ✅ Checklist de Implementación

- [x] Migración 022 creada (campo `estado`)
- [x] Migración 023 creada (índices)
- [x] Script de archivado creado
- [x] Migraciones agregadas a `run-migrations.sh`
- [ ] Ejecutar `./run-migrations.sh`
- [ ] Probar script de archivado
- [ ] Implementar `getAllPaginated()` en `postgres-client.js`
- [ ] Modificar endpoint `/api/pedidos` en `index.js`
- [ ] Crear `store.getPaginated()` en `services/storage.ts`
- [ ] Modificar `usePedidosManager.ts` para usar paginación
- [ ] Agregar componente `FiltrosAvanzados.tsx`
- [ ] Configurar cron job (opcional)
- [ ] Probar con 2000+ pedidos

---

**¿Necesitas ayuda con alguna fase específica? ¡Pregúntame!** 🚀
