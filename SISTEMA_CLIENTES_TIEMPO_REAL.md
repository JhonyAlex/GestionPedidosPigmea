# Sistema de Clientes en Tiempo Real - Gestión de Pedidos Pigmea

## 📋 Resumen

Se ha implementado un sistema completo de gestión de clientes en tiempo real para la aplicación de Gestión de Pedidos Pigmea. El sistema incluye:

- ✅ **Creación automática de clientes** cuando se crean pedidos
- ✅ **Sincronización en tiempo real** a través de WebSocket
- ✅ **Directorio de clientes** con búsqueda y filtros
- ✅ **Estadísticas automáticas** calculadas desde la base de datos
- ✅ **API REST completa** para operaciones CRUD
- ✅ **Base de datos PostgreSQL** con triggers automáticos

## 🏗️ Arquitectura del Sistema

### Base de Datos
- **Tabla `clientes`**: Almacena información completa de clientes
- **Triggers automáticos**: Actualizan estadísticas cuando cambian los pedidos
- **Funciones PostgreSQL**: Calculan métricas en tiempo real

### Backend API
- **Endpoints CRUD**: `/api/clientes/*` para gestión completa
- **WebSocket events**: Emite eventos de clientes en tiempo real
- **Creación automática**: Al crear pedidos, se crean clientes automáticamente

### Frontend
- **Hook useClientesManager**: Maneja estado y operaciones de clientes
- **Componentes React**: DirectorioView, ClienteModal, ClienteCard
- **Tiempo real**: WebSocket para sincronización instantánea

## 🔧 Componentes Implementados

### 1. Base de Datos (`database/migrations/create_clientes_table.sql`)

```sql
-- Tabla principal de clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) UNIQUE NOT NULL,
    contacto VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(50),
    ciudad VARCHAR(100),
    direccion TEXT,
    pais VARCHAR(100),
    codigo_postal VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    total_pedidos INTEGER DEFAULT 0,
    pedidos_activos INTEGER DEFAULT 0,
    volumen_total NUMERIC(12,2) DEFAULT 0,
    monto_total NUMERIC(15,2) DEFAULT 0,
    notas TEXT
);

-- Función para recalcular estadísticas automáticamente
CREATE OR REPLACE FUNCTION recalcular_estadisticas_cliente(cliente_nombre VARCHAR)
-- Trigger que se ejecuta cuando cambian los pedidos
CREATE OR REPLACE FUNCTION actualizar_cliente_por_pedido()
```

### 2. Backend API (`backend/index.js`)

**Endpoints implementados:**
- `GET /api/clientes` - Listar todos los clientes
- `POST /api/clientes` - Crear nuevo cliente
- `GET /api/clientes/:id` - Obtener cliente específico
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente
- `GET /api/clientes/:id/estadisticas` - Estadísticas detalladas

**WebSocket Events emitidos:**
- `cliente-created` - Cuando se crea un cliente
- `cliente-updated` - Cuando se actualiza un cliente
- `cliente-deleted` - Cuando se elimina un cliente
- `cliente-stats-updated` - Cuando se actualizan estadísticas

### 3. Frontend Hook (`hooks/useClientesManager.ts`)

**Funcionalidades:**
- ✅ Carga de clientes desde API
- ✅ Creación automática si no existe
- ✅ Operaciones CRUD completas
- ✅ Manejo de estadísticas asíncronas
- ✅ Fallback a datos locales si API no disponible
- ✅ Handlers para eventos WebSocket

**Métodos principales:**
```typescript
const {
    clientes,
    isLoading,
    error,
    findClienteByName,
    createClienteIfNotExists,
    updateClienteStats,
    createCliente,
    updateCliente,
    deleteCliente,
    getClienteEstadisticas,
    handleClienteCreated,
    handleClienteUpdated,
    handleClienteDeleted,
    handleClienteStatsUpdated
} = useClientesManager();
```

### 4. Componentes UI

#### DirectorioView (`components/DirectorioView.tsx`)
- **Funcionalidad**: Vista principal del directorio de clientes
- **Características**:
  - Búsqueda por nombre, ciudad, email
  - Filtros por estado (activos/inactivos)
  - Ordenación por múltiples criterios
  - Estadísticas en dashboard
  - Tarjetas responsivas

#### ClienteModal (`components/ClienteModal.tsx`)
- **Funcionalidad**: Modal detallado de información del cliente
- **Tabs disponibles**:
  - Perfil: Información básica y contacto
  - Pedidos: Lista de pedidos del cliente
  - Estadísticas: Métricas y análisis

#### ClienteCard (`components/ClienteCard.tsx`)
- **Funcionalidad**: Tarjeta resumida de cliente
- **Información mostrada**:
  - Datos básicos de contacto
  - Estadísticas de pedidos
  - Estado activo/inactivo
  - Última actividad

### 5. WebSocket Real-time (`services/websocket.ts`)

**Eventos de clientes implementados:**
```typescript
// Suscripciones disponibles
subscribeToClienteCreated(callback)
subscribeToClienteUpdated(callback)
subscribeToClienteDeleted(callback)
subscribeToClienteStatsUpdated(callback)

// Notificaciones automáticas
- "Nuevo cliente creado: [nombre]"
- "Cliente actualizado: [nombre]"
- "Cliente eliminado: [nombre]"
- "Estadísticas actualizadas para: [nombre]"
```

## 🔄 Flujo de Creación Automática

### Cuando se crea un pedido:

1. **Frontend**: `usePedidosManager.handleAddPedido()`
   - Llama a `createClienteIfNotExists(cliente.nombre)`
   - Actualiza estadísticas con `updateClienteStats()`

2. **Backend**: `POST /api/pedidos`
   - Verificar si cliente existe en BD
   - Si no existe, crear automáticamente
   - Emitir evento `cliente-created` via WebSocket

3. **Base de Datos**: Triggers automáticos
   - `actualizar_cliente_por_pedido()` se ejecuta
   - `recalcular_estadisticas_cliente()` actualiza métricas
   - Estadísticas sincronizadas automáticamente

4. **Frontend**: WebSocket listeners
   - `handleClienteCreated()` actualiza lista local
   - `handleClienteStatsUpdated()` refresca estadísticas
   - UI se actualiza en tiempo real

## 📊 Estadísticas Calculadas

### Métricas automáticas:
- **Total de pedidos**: Conteo histórico
- **Pedidos activos**: Pedidos no completados/archivados
- **Pedidos completados**: Pedidos finalizados
- **Volumen total**: Suma de metros cuadrados
- **Tiempo promedio de producción**: Análisis de duración
- **Productos más solicitados**: Top 5 productos
- **Tendencia mensual**: Evolución histórica
- **Etapas más comunes**: Análisis de flujo

### Actualización automática:
- ✅ Al crear pedidos
- ✅ Al cambiar etapas
- ✅ Al completar pedidos
- ✅ Al archivar pedidos

## 🌐 Sincronización en Tiempo Real

### Escenarios cubiertos:

1. **Usuario A** crea un pedido → **Usuario B** ve el cliente aparecer instantáneamente
2. **Usuario A** actualiza datos de cliente → **Usuario B** ve los cambios en tiempo real
3. **Estadísticas** se actualizan automáticamente para todos los usuarios conectados
4. **Notificaciones** informan sobre cambios importantes

### Tecnologías utilizadas:
- **WebSocket**: Para comunicación bidireccional
- **Socket.io**: Gestión de conexiones y eventos
- **React Hooks**: Estado reactivo en frontend
- **PostgreSQL Triggers**: Automatización en base de datos

## 🚀 Configuración y Uso

### Para desarrolladores:

1. **Instalar dependencias**:
   ```bash
   cd backend && npm install
   cd .. && npm install
   ```

2. **Configurar base de datos**:
   ```bash
   cd database && ./apply-migration.sh create_clientes_table.sql
   ```

3. **Iniciar servicios**:
   ```bash
   # Backend
   cd backend && npm start
   
   # Frontend
   npm run dev
   ```

### Para usuarios finales:

1. **Acceder al directorio**: Menú → "Directorio de Clientes"
2. **Crear cliente manual**: Botón "Nuevo Cliente"
3. **Creación automática**: Simplemente crear pedidos con nombres de cliente
4. **Ver estadísticas**: Click en tarjeta de cliente → Tab "Estadísticas"

## 🔧 Configuración Técnica

### Variables de entorno necesarias:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_pedidos
DB_USER=postgres
DB_PASSWORD=password
```

### Dependencias agregadas:
- **Frontend**: Ninguna adicional (usa librerías existentes)
- **Backend**: Usa PostgreSQL client existente

## 📝 Próximas Mejoras

### Funcionalidades pendientes:
- [ ] **Edición en modal**: Formulario completo de edición
- [ ] **Importación masiva**: CSV/Excel de clientes
- [ ] **Exportación de datos**: PDF/Excel de directorio
- [ ] **Análisis avanzados**: Gráficos de tendencias
- [ ] **Segmentación**: Categorización automática de clientes
- [ ] **Alertas**: Notificaciones de clientes inactivos

### Optimizaciones técnicas:
- [ ] **Cache**: Redis para estadísticas frecuentes
- [ ] **Paginación**: Para directorios grandes
- [ ] **Índices**: Optimización de consultas PostgreSQL
- [ ] **Compresión**: Optimización de payloads WebSocket

---

## ✅ Estado Actual

**Sistema completamente funcional** con todas las características principales implementadas:

- ✅ Creación automática de clientes ✅
- ✅ Tiempo real con WebSocket ✅
- ✅ API REST completa ✅
- ✅ Interfaz de usuario intuitiva ✅
- ✅ Estadísticas automatizadas ✅
- ✅ Base de datos robusta ✅

**¡El sistema está listo para producción!** 🎉