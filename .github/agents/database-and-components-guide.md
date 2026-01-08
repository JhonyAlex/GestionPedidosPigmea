# 🛡️ Guía de Modificaciones: Base de Datos y Componentes

> **Propósito**: Criterios obligatorios para LLMs al modificar esquemas de BD, APIs o componentes del sistema.

---

## ⚠️ REGLA DE ORO: Detenerse y Confirmar

**ANTES de ejecutar cualquier cambio**, el LLM debe verificar:

| Condición | Acción Requerida |
|-----------|------------------|
| Modifica esquema de BD (nuevas tablas/columnas) | ✋ Confirmar con usuario |
| Afecta más de 3 archivos | ✋ Listar archivos y confirmar |
| Cambia interfaces/tipos compartidos | ✋ Mostrar componentes afectados |
| Modifica endpoints existentes | ✋ Verificar consumidores |
| Elimina código o funcionalidad | ✋ Confirmar impacto |

---

## 📁 Estructura de Archivos por Dominio

```
├── database/migrations/     → Solo archivos .sql numerados (NNN-descripcion.sql)
├── backend/
│   ├── index.js             → Endpoints API (máx ~300 líneas por sección)
│   ├── postgres-client.js   → Métodos de BD agrupados por entidad
│   └── middleware/          → Lógica transversal (auth, permisos)
├── hooks/                   → 1 hook = 1 responsabilidad
├── components/              → Componentes React (máx ~500 líneas)
├── services/                → Lógica de negocio reutilizable
├── types/                   → Interfaces TypeScript centralizadas
└── utils/                   → Funciones puras sin estado
```

---

## 🔧 Checklist Obligatorio para Cambios

### 1. Base de Datos
- [ ] Crear migración SQL idempotente (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`)
- [ ] Nombrar migración: `NNN-descripcion-corta.sql`
- [ ] Añadir `COMMENT ON` para documentar campos
- [ ] Verificar índices necesarios para queries frecuentes
- [ ] **NO modificar migraciones ya ejecutadas en producción**

### 2. Backend (postgres-client.js)
- [ ] Agrupar métodos por entidad (// === GESTIÓN DE X ===)
- [ ] Usar camelCase en RETURNING para mapeo JS
- [ ] Validar datos antes de queries
- [ ] Manejar errores con mensajes descriptivos
- [ ] Liberar conexiones en `finally`

### 3. Backend (index.js - Endpoints)
- [ ] Seguir patrón REST existente
- [ ] Usar `requirePermission()` donde aplique
- [ ] Emitir evento WebSocket si afecta UI en tiempo real
- [ ] Documentar endpoint con comentario: `// MÉTODO /api/ruta - Descripción`

### 4. Frontend (Types)
- [ ] Añadir nuevos campos a `types.ts` o archivo específico en `types/`
- [ ] Usar `?` para campos opcionales
- [ ] Documentar con JSDoc cuando sea necesario

### 5. Frontend (Hooks)
- [ ] 1 hook = 1 responsabilidad clara
- [ ] Usar patrón singleton si es estado global compartido
- [ ] Incluir cleanup en useEffect
- [ ] Suscribirse a WebSocket para sincronización

### 6. Frontend (Componentes)
- [ ] Máximo ~500 líneas; si excede, extraer subcomponentes
- [ ] Props tipadas con interface
- [ ] Estilos consistentes con Tailwind existente
- [ ] Soportar dark mode (`dark:` prefixes)

---

## 🚫 Prohibiciones

1. **NO** crear archivos de documentación `.md` por cada cambio (a menos que se solicite)
2. **NO** duplicar lógica - reutilizar hooks/utils existentes
3. **NO** hardcodear URLs - usar `/api/` relativo
4. **NO** omitir headers de autenticación en fetch
5. **NO** modificar múltiples dominios sin confirmación
6. **NO** hacer archivos monolíticos - modularizar
7. **NO** eliminar código sin confirmar que no tiene dependencias

---

## 🔄 Flujo de Cambios en BD

```
1. Crear migración SQL en database/migrations/
2. Añadir métodos en postgres-client.js
3. Crear/actualizar endpoints en index.js
4. Actualizar tipos en types.ts o types/
5. Crear/actualizar hook si es necesario
6. Integrar en componente(s)
7. Añadir eventos WebSocket si aplica
8. Ejecutar migración en producción
```

---

## 📡 WebSocket: Cuándo Emitir Eventos

| Acción | Evento Requerido | Ejemplo |
|--------|------------------|---------|
| CREATE | `entidad-created` | `io.emit('pedido-created', data)` |
| UPDATE | `entidad-updated` | `io.emit('pedido-updated', data)` |
| DELETE | `entidad-deleted` | `io.emit('pedido-deleted', { id })` |
| Cambio de estado global | `entidad-*` según acción | - |

**Importante**: Actualizar `services/websocket.ts` → `WebSocketEvents` interface.

---

## 🧪 Validación Pre-Deploy

Antes de considerar un cambio completo:

1. `get_errors()` sin errores de TypeScript
2. Endpoints probados con fetch/curl
3. Migración SQL ejecutada sin errores
4. Componente renderiza correctamente
5. Eventos WebSocket funcionan en tiempo real

---

## 💡 Decisiones Arquitectónicas

### Cuándo crear un nuevo hook
- Lógica reutilizada en 2+ componentes
- Gestión de estado complejo
- Sincronización con WebSocket

### Cuándo crear un nuevo componente
- UI reutilizable
- Sección con lógica propia >100 líneas
- Requiere estado interno aislado

### Cuándo crear nueva tabla vs añadir columna
- **Nueva tabla**: Entidad independiente con relaciones
- **Nueva columna**: Atributo de entidad existente

### Cuándo usar JSONB vs columnas separadas
- **JSONB**: Datos flexibles/anidados, no se filtran frecuentemente
- **Columnas**: Datos estructurados, se filtran/indexan

---

## 📋 Template de Confirmación

Cuando un cambio requiera confirmación, usar este formato:

```
⚠️ Este cambio afecta múltiples áreas:

**Base de datos:**
- [ ] Nueva tabla/columna: `nombre`

**Backend:**
- [ ] Nuevo endpoint: `MÉTODO /api/ruta`
- [ ] Archivo: `postgres-client.js` (+N líneas)

**Frontend:**
- [ ] Tipos: `types.ts`
- [ ] Hook: `useNuevoHook.ts`
- [ ] Componentes: `Componente1.tsx`, `Componente2.tsx`

**WebSocket:**
- [ ] Evento: `evento-nuevo`

¿Confirmas que proceda con todos estos cambios?
```

---

*Última actualización: Enero 2026*
