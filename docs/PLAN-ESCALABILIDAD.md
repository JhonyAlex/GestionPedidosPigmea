# 📈 Plan de Escalabilidad - Sistema de Gestión de Pedidos

## 🎯 Objetivo
Preparar el sistema para manejar **2000+ registros** sin pérdida de rendimiento.

---

## 📊 Estado Actual (Problemas Detectados)

### ❌ Problema 1: Carga Masiva de Datos
- **Backend:** `GET /api/pedidos` devuelve TODOS los pedidos sin límites
- **Frontend:** `usePedidosManager` carga todo en memoria React
- **Impacto con 2000 registros:**
  - ~1-2MB de datos transferidos por carga
  - ~300-500MB de RAM en navegador
  - Tiempos de carga: 5-10 segundos
  - Re-renders masivos → UI bloqueada

### ❌ Problema 2: Sin Índices Optimizados
- Búsquedas por texto, fechas y cliente no están indexadas
- Consultas lentas en BD (>500ms con 2000 registros)

### ❌ Problema 3: Sin Sistema de Archivado
- Pedidos de hace 6+ meses se cargan innecesariamente
- No hay distinción entre pedidos activos y antiguos

---

## ✅ Soluciones Propuestas (En Orden de Prioridad)

---

### 🔥 **SOLUCIÓN 1: Paginación + Filtro por Fecha (CRÍTICO)**

#### **Implementación Backend**

**Archivo:** `backend/postgres-client.js`

```javascript
// NUEVO MÉTODO: Obtener pedidos con filtros y paginación
async getAllPaginated(options = {}) {
    if (!this.isInitialized) {
        throw new Error('Database not initialized');
    }

    const {
        page = 1,
        limit = 100,
        fechaEntregaDesde = null,  // Filtrar por fecha de entrega
        fechaEntregaHasta = null,
        incluirArchivados = false,
        incluirCompletados = true,
        etapas = null  // Array de etapas específicas
    } = options;

    const offset = (page - 1) * limit;
    const client = await this.pool.connect();
    
    try {
        let query = 'SELECT data FROM pedidos WHERE 1=1';
        const params = [];
        let paramCount = 1;

        // Filtro: Excluir archivados por defecto
        if (!incluirArchivados) {
            query += ` AND data->>'etapaActual' != 'ARCHIVADO'`;
        }

        // Filtro: Incluir/excluir completados
        if (!incluirCompletados) {
            query += ` AND data->>'etapaActual' != 'COMPLETADO'`;
        }

        // Filtro: Fecha de entrega mínima (ej: últimos 2 meses)
        if (fechaEntregaDesde) {
            query += ` AND (data->>'fechaEntrega')::date >= $${paramCount}`;
            params.push(fechaEntregaDesde);
            paramCount++;
        }

        // Filtro: Fecha de entrega máxima
        if (fechaEntregaHasta) {
            query += ` AND (data->>'fechaEntrega')::date <= $${paramCount}`;
            params.push(fechaEntregaHasta);
            paramCount++;
        }

        // Filtro: Etapas específicas
        if (etapas && Array.isArray(etapas) && etapas.length > 0) {
            query += ` AND data->>'etapaActual' = ANY($${paramCount})`;
            params.push(etapas);
            paramCount++;
        }

        // Orden y paginación
        query += ` ORDER BY secuencia_pedido DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await client.query(query, params);

        // Obtener total para paginación
        let countQuery = 'SELECT COUNT(*) FROM pedidos WHERE 1=1';
        const countParams = [];
        let countParamCount = 1;

        if (!incluirArchivados) {
            countQuery += ` AND data->>'etapaActual' != 'ARCHIVADO'`;
        }
        if (!incluirCompletados) {
            countQuery += ` AND data->>'etapaActual' != 'COMPLETADO'`;
        }
        if (fechaEntregaDesde) {
            countQuery += ` AND (data->>'fechaEntrega')::date >= $${countParamCount}`;
            countParams.push(fechaEntregaDesde);
            countParamCount++;
        }
        if (fechaEntregaHasta) {
            countQuery += ` AND (data->>'fechaEntrega')::date <= $${countParamCount}`;
            countParams.push(fechaEntregaHasta);
            countParamCount++;
        }
        if (etapas && Array.isArray(etapas) && etapas.length > 0) {
            countQuery += ` AND data->>'etapaActual' = ANY($${countParamCount})`;
            countParams.push(etapas);
        }

        const countResult = await client.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        return {
            pedidos: result.rows.map(row => row.data),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        
    } finally {
        client.release();
    }
}
```

#### **Implementación Backend - Endpoint**

**Archivo:** `backend/index.js`

```javascript
// REEMPLAZAR endpoint GET /api/pedidos con versión paginada
app.get('/api/pedidos', async (req, res) => {
    try {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        if (!dbClient.isInitialized) {
            console.log('⚠️ BD no disponible - devolviendo datos mock');
            return res.status(200).json({ pedidos: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } });
        }

        // Extraer parámetros de query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100; // 100 por defecto
        const incluirArchivados = req.query.incluirArchivados === 'true';
        const incluirCompletados = req.query.incluirCompletados !== 'false'; // true por defecto

        // Calcular fecha de hace 2 meses (para filtro por defecto)
        const dosMesesAtras = new Date();
        dosMesesAtras.setMonth(dosMesesAtras.getMonth() - 2);
        const fechaEntregaDesde = req.query.fechaEntregaDesde || dosMesesAtras.toISOString().split('T')[0];

        const result = await dbClient.getAllPaginated({
            page,
            limit,
            fechaEntregaDesde: req.query.sinFiltroFecha ? null : fechaEntregaDesde,
            fechaEntregaHasta: req.query.fechaEntregaHasta || null,
            incluirArchivados,
            incluirCompletados,
            etapas: req.query.etapas ? req.query.etapas.split(',') : null
        });

        console.log(`📊 GET /api/pedidos - Página ${page}: ${result.pedidos.length}/${result.pagination.total} pedidos`);
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error("Error in GET /api/pedidos:", error);
        res.status(500).json({ 
            message: "Error interno del servidor al obtener los pedidos.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
});
```

#### **Implementación Frontend**

**Archivo:** `services/storage.ts` (NUEVO)

```typescript
import { Pedido } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface PaginationOptions {
    page?: number;
    limit?: number;
    fechaEntregaDesde?: string;
    fechaEntregaHasta?: string;
    incluirArchivados?: boolean;
    incluirCompletados?: boolean;
    etapas?: string[];
    sinFiltroFecha?: boolean;
}

export interface PaginatedResponse {
    pedidos: Pedido[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const store = {
    // NUEVO: Obtener pedidos con paginación
    async getPaginated(options: PaginationOptions = {}, authHeaders: any = {}): Promise<PaginatedResponse> {
        const params = new URLSearchParams();
        
        if (options.page) params.append('page', String(options.page));
        if (options.limit) params.append('limit', String(options.limit));
        if (options.fechaEntregaDesde) params.append('fechaEntregaDesde', options.fechaEntregaDesde);
        if (options.fechaEntregaHasta) params.append('fechaEntregaHasta', options.fechaEntregaHasta);
        if (options.incluirArchivados) params.append('incluirArchivados', 'true');
        if (options.incluirCompletados === false) params.append('incluirCompletados', 'false');
        if (options.etapas && options.etapas.length > 0) params.append('etapas', options.etapas.join(','));
        if (options.sinFiltroFecha) params.append('sinFiltroFecha', 'true');

        const response = await fetch(`${API_URL}/pedidos?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener pedidos: ${response.statusText}`);
        }

        return await response.json();
    },

    // MANTENER método legacy para compatibilidad (pero marcarlo como deprecated)
    async getAll(authHeaders: any = {}): Promise<Pedido[]> {
        console.warn('⚠️ store.getAll() está deprecado. Usar store.getPaginated() en su lugar.');
        const result = await this.getPaginated({ sinFiltroFecha: true }, authHeaders);
        return result.pedidos;
    },

    // ... resto de métodos (create, update, delete, etc.)
};
```

**Archivo:** `hooks/usePedidosManager.ts` (MODIFICAR)

```typescript
// AGREGAR estado de paginación
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalPedidos, setTotalPedidos] = useState(0);

// MODIFICAR useEffect inicial
useEffect(() => {
    const initStore = async () => {
        setIsLoading(true);
        const startTime = Date.now();
        
        try {
            const authHeaders = getAuthHeaders();
            
            // Cargar solo últimos 2 meses por defecto
            const result = await store.getPaginated({
                page: 1,
                limit: 100,
                // NO enviar fechaEntregaDesde para cargar últimos 2 meses por defecto
            }, authHeaders);
            
            setPedidos(result.pedidos);
            setCurrentPage(result.pagination.page);
            setTotalPages(result.pagination.totalPages);
            setTotalPedidos(result.pagination.total);
            
            const loadTime = Date.now() - startTime;
            console.log(`✅ Pedidos cargados: ${result.pedidos.length}/${result.pagination.total} en ${loadTime}ms`);
            
        } catch (error) {
            console.error("❌ Error al cargar pedidos:", error);
            alert("No se pudo conectar al servidor.");
        } finally {
            setIsLoading(false);
        }
    };
    initStore();
}, []);

// AGREGAR función para cargar más páginas
const loadMorePedidos = async () => {
    if (currentPage >= totalPages) return;
    
    setIsLoading(true);
    try {
        const authHeaders = getAuthHeaders();
        const result = await store.getPaginated({
            page: currentPage + 1,
            limit: 100
        }, authHeaders);
        
        setPedidos(prev => [...prev, ...result.pedidos]);
        setCurrentPage(result.pagination.page);
        
    } catch (error) {
        console.error("❌ Error al cargar más pedidos:", error);
    } finally {
        setIsLoading(false);
    }
};

// AGREGAR función para buscar pedidos antiguos (cuando el usuario lo solicite)
const loadOlderPedidos = async (fechaDesde: string, fechaHasta?: string) => {
    setIsLoading(true);
    try {
        const authHeaders = getAuthHeaders();
        const result = await store.getPaginated({
            page: 1,
            limit: 100,
            fechaEntregaDesde: fechaDesde,
            fechaEntregaHasta: fechaHasta,
            sinFiltroFecha: true
        }, authHeaders);
        
        // REEMPLAZAR pedidos actuales con resultados de búsqueda
        setPedidos(result.pedidos);
        setCurrentPage(1);
        setTotalPages(result.pagination.totalPages);
        setTotalPedidos(result.pagination.total);
        
    } catch (error) {
        console.error("❌ Error al buscar pedidos antiguos:", error);
    } finally {
        setIsLoading(false);
    }
};
```

---

### 🗂️ **SOLUCIÓN 2: Campo `estado` para Archivado Automático**

#### **Migración SQL**

**Archivo:** `database/migrations/017-add-estado-pedido.sql`

```sql
-- Migración 017: Agregar campo 'estado' para gestión de archivado

-- 1. Agregar columna estado (si no existe)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'ACTIVO';

-- 2. Crear índice para búsquedas rápidas por estado
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);

-- 3. Crear índice compuesto para fecha_entrega + estado (consultas más eficientes)
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega_estado ON pedidos((data->>'fechaEntrega'), estado);

-- 4. Actualizar pedidos existentes según su etapa actual
DO $$ 
BEGIN
    -- Marcar pedidos archivados
    UPDATE pedidos 
    SET estado = 'ARCHIVADO' 
    WHERE data->>'etapaActual' = 'ARCHIVADO' 
      AND estado = 'ACTIVO';

    -- Marcar pedidos completados antiguos (>2 meses) como INACTIVO
    UPDATE pedidos 
    SET estado = 'INACTIVO' 
    WHERE data->>'etapaActual' = 'COMPLETADO' 
      AND (data->>'fechaEntrega')::date < CURRENT_DATE - INTERVAL '2 months'
      AND estado = 'ACTIVO';
      
    RAISE NOTICE 'Estado de pedidos actualizado correctamente.';
END $$;

-- 5. Comentarios para documentación
COMMENT ON COLUMN pedidos.estado IS 'Estado del pedido: ACTIVO (en proceso), INACTIVO (completado hace >2 meses), ARCHIVADO (manualmente archivado)';
```

**Archivo:** `backend/run-migrations.sh` (AGREGAR)

```bash
# ... migraciones anteriores ...
psql $DATABASE_URL -f database/migrations/017-add-estado-pedido.sql
```

#### **Script de Archivado Automático**

**Archivo:** `backend/scripts/auto-archive-old-pedidos.js` (NUEVO)

```javascript
// Script para archivar automáticamente pedidos antiguos
// Ejecutar diariamente vía cron o tarea programada

const PostgreSQLClient = require('../postgres-client');

async function autoArchiveOldPedidos() {
    const dbClient = new PostgreSQLClient();
    
    try {
        await dbClient.initialize();
        
        const dosMesesAtras = new Date();
        dosMesesAtras.setMonth(dosMesesAtras.getMonth() - 2);
        const fechaLimite = dosMesesAtras.toISOString().split('T')[0];
        
        console.log(`🗄️ Archivando pedidos completados antes de ${fechaLimite}...`);
        
        const query = `
            UPDATE pedidos 
            SET estado = 'INACTIVO' 
            WHERE data->>'etapaActual' = 'COMPLETADO' 
              AND (data->>'fechaEntrega')::date < $1
              AND estado = 'ACTIVO'
            RETURNING id, data->>'numeroPedidoCliente' as numero
        `;
        
        const result = await dbClient.pool.query(query, [fechaLimite]);
        
        console.log(`✅ ${result.rowCount} pedidos archivados automáticamente.`);
        result.rows.forEach(row => {
            console.log(`  - Pedido ${row.numero} (ID: ${row.id})`);
        });
        
        return result.rowCount;
        
    } catch (error) {
        console.error('❌ Error al archivar pedidos:', error);
        throw error;
    } finally {
        await dbClient.close();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    autoArchiveOldPedidos()
        .then(count => {
            console.log(`\n🎉 Proceso completado. ${count} pedidos archivados.`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Error en el proceso de archivado:', error);
            process.exit(1);
        });
}

module.exports = { autoArchiveOldPedidos };
```

**Configurar Cron Job (Linux/Docker):**

```bash
# Ejecutar diariamente a las 3:00 AM
0 3 * * * cd /app/backend && node scripts/auto-archive-old-pedidos.js >> /var/log/auto-archive.log 2>&1
```

---

### 🔍 **SOLUCIÓN 3: Índices Optimizados en Base de Datos**

#### **Migración SQL**

**Archivo:** `database/migrations/018-add-performance-indexes.sql`

```sql
-- Migración 018: Agregar índices para optimización de consultas

-- 1. Índice para búsqueda por numeroPedidoCliente (muy común)
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_cliente 
ON pedidos((data->>'numeroPedidoCliente'));

-- 2. Índice para búsqueda por nombre de cliente
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente 
ON pedidos((data->>'cliente'));

-- 3. Índice para filtro por etapaActual
CREATE INDEX IF NOT EXISTS idx_pedidos_etapa 
ON pedidos((data->>'etapaActual'));

-- 4. Índice compuesto: etapaActual + fechaEntrega (consultas Kanban)
CREATE INDEX IF NOT EXISTS idx_pedidos_etapa_fecha 
ON pedidos((data->>'etapaActual'), (data->>'fechaEntrega'));

-- 5. Índice para ordenamiento por secuencia (más rápido)
CREATE INDEX IF NOT EXISTS idx_pedidos_secuencia 
ON pedidos(secuencia_pedido DESC);

-- 6. Índice para búsqueda full-text en números de compra
CREATE INDEX IF NOT EXISTS idx_pedidos_numeros_compra_gin 
ON pedidos USING gin((data->'numerosCompra'));

-- 7. Índice para clienteId (foreign key)
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id 
ON pedidos(cliente_id);

-- 8. Índice para vendedorId (foreign key)
CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor_id 
ON pedidos(vendedor_id);

RAISE NOTICE 'Índices de rendimiento creados exitosamente.';
```

**Agregar a `backend/run-migrations.sh`**

---

### 📊 **SOLUCIÓN 4: Lazy Loading en Frontend (Scroll Infinito)**

**Archivo:** `components/PedidoList.tsx` (NUEVO COMPONENTE)

```typescript
import React, { useEffect, useRef } from 'react';
import { Pedido } from '../types';

interface PedidoListProps {
    pedidos: Pedido[];
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
}

export function PedidoList({ pedidos, onLoadMore, hasMore, isLoading }: PedidoListProps) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Configurar Intersection Observer para scroll infinito
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    console.log('📜 Cargando más pedidos...');
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, isLoading, onLoadMore]);

    return (
        <div className="pedidos-list">
            {pedidos.map(pedido => (
                <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
            
            {/* Elemento centinela para detectar scroll */}
            {hasMore && (
                <div ref={loadMoreRef} className="load-more-trigger" style={{ height: '50px' }}>
                    {isLoading && <p>Cargando más pedidos...</p>}
                </div>
            )}
            
            {!hasMore && pedidos.length > 0 && (
                <p className="text-center text-gray-500 mt-4">
                    ✅ Todos los pedidos cargados
                </p>
            )}
        </div>
    );
}
```

---

### 🎛️ **SOLUCIÓN 5: Filtros Avanzados en UI**

**Archivo:** `components/FiltrosAvanzados.tsx` (NUEVO)

```typescript
import React, { useState } from 'react';

interface FiltrosAvanzadosProps {
    onApplyFilters: (filtros: any) => void;
}

export function FiltrosAvanzados({ onApplyFilters }: FiltrosAvanzadosProps) {
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [rangoFechas, setRangoFechas] = useState<'2meses' | '6meses' | 'custom'>('2meses');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const aplicarFiltros = () => {
        let fechaEntregaDesde: string | null = null;
        let fechaEntregaHasta: string | null = null;

        if (rangoFechas === '2meses') {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - 2);
            fechaEntregaDesde = fecha.toISOString().split('T')[0];
        } else if (rangoFechas === '6meses') {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - 6);
            fechaEntregaDesde = fecha.toISOString().split('T')[0];
        } else if (rangoFechas === 'custom') {
            fechaEntregaDesde = fechaDesde || null;
            fechaEntregaHasta = fechaHasta || null;
        }

        onApplyFilters({
            fechaEntregaDesde,
            fechaEntregaHasta,
            sinFiltroFecha: false
        });
    };

    const cargarTodosSinFiltro = () => {
        onApplyFilters({ sinFiltroFecha: true });
    };

    return (
        <div className="filtros-avanzados">
            <button onClick={() => setMostrarFiltros(!mostrarFiltros)}>
                🔍 Filtros Avanzados
            </button>

            {mostrarFiltros && (
                <div className="filtros-panel">
                    <h3>Filtrar por Fecha de Entrega</h3>
                    
                    <label>
                        <input
                            type="radio"
                            value="2meses"
                            checked={rangoFechas === '2meses'}
                            onChange={(e) => setRangoFechas(e.target.value as any)}
                        />
                        Últimos 2 meses (recomendado)
                    </label>

                    <label>
                        <input
                            type="radio"
                            value="6meses"
                            checked={rangoFechas === '6meses'}
                            onChange={(e) => setRangoFechas(e.target.value as any)}
                        />
                        Últimos 6 meses
                    </label>

                    <label>
                        <input
                            type="radio"
                            value="custom"
                            checked={rangoFechas === 'custom'}
                            onChange={(e) => setRangoFechas(e.target.value as any)}
                        />
                        Rango personalizado
                    </label>

                    {rangoFechas === 'custom' && (
                        <div>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                placeholder="Desde"
                            />
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                placeholder="Hasta"
                            />
                        </div>
                    )}

                    <button onClick={aplicarFiltros}>Aplicar Filtros</button>
                    <button onClick={cargarTodosSinFiltro}>Cargar TODOS (⚠️ lento)</button>
                </div>
            )}
        </div>
    );
}
```

---

## 📈 Resultados Esperados

| Métrica | Antes (Sin optimización) | Después (Optimizado) |
|---------|--------------------------|----------------------|
| **Tiempo de carga inicial** | 5-10 segundos | 0.5-1 segundo |
| **Datos transferidos** | 1-2 MB | 100-200 KB |
| **Memoria RAM (navegador)** | 300-500 MB | 50-80 MB |
| **Velocidad de búsqueda** | 500ms-2s | 50-150ms |
| **Experiencia de usuario** | ❌ Lenta, bloqueada | ✅ Rápida, fluida |

---

## 🚀 Plan de Implementación (Orden Recomendado)

### Fase 1: Optimización Crítica (1-2 días)
1. ✅ Crear migración `017-add-estado-pedido.sql`
2. ✅ Agregar método `getAllPaginated()` en `postgres-client.js`
3. ✅ Modificar endpoint `/api/pedidos` para soportar paginación
4. ✅ Crear migración `018-add-performance-indexes.sql`
5. ✅ Ejecutar ambas migraciones en BD

### Fase 2: Frontend Adaptativo (1 día)
6. ✅ Crear `store.getPaginated()` en `services/storage.ts`
7. ✅ Modificar `usePedidosManager` para usar paginación
8. ✅ Agregar estado de paginación (currentPage, totalPages, etc.)

### Fase 3: UI/UX Mejorada (1 día)
9. ✅ Crear componente `FiltrosAvanzados.tsx`
10. ✅ Implementar scroll infinito (opcional)
11. ✅ Agregar indicador de "X de Y pedidos cargados"

### Fase 4: Automatización (opcional)
12. ✅ Crear script `auto-archive-old-pedidos.js`
13. ✅ Configurar cron job para ejecución diaria

---

## 🧪 Pruebas Recomendadas

```bash
# 1. Probar endpoint con paginación
curl "http://localhost:8080/api/pedidos?page=1&limit=50"

# 2. Probar filtro por fecha
curl "http://localhost:8080/api/pedidos?fechaEntregaDesde=2025-09-01"

# 3. Probar con 2000+ registros (crear script de carga)
node backend/scripts/generate-test-pedidos.js --count=2000

# 4. Medir rendimiento de consultas SQL
psql -c "EXPLAIN ANALYZE SELECT data FROM pedidos WHERE (data->>'fechaEntrega')::date >= '2025-09-01' ORDER BY secuencia_pedido DESC LIMIT 100;"
```

---

## ⚠️ Consideraciones Importantes

1. **Compatibilidad hacia atrás:** El método `store.getAll()` se mantiene pero marcado como deprecated.
2. **Migración gradual:** Los clientes existentes seguirán funcionando mientras migras el frontend.
3. **Caché del navegador:** Limpiar caché después de actualizar para evitar problemas.
4. **Monitoreo:** Agregar logs en backend para detectar consultas lentas.

---

## 📚 Recursos Adicionales

- [PostgreSQL JSON Performance](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING)
- [React Virtualization](https://github.com/bvaughn/react-window)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
