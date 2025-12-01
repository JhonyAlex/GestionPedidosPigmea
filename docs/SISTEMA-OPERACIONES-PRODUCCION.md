# 🔧 Sistema de Operaciones de Producción - Gestión Pedidos Pigmea

## 📋 Descripción General

Sistema completo de gestión de operaciones de producción en tiempo real que permite a los operadores:
- Ver pedidos disponibles para trabajar
- Iniciar operaciones en máquinas específicas
- Pausar y reanudar trabajo
- Registrar metros producidos
- Completar operaciones con tracking de tiempo
- Ver métricas de producción en tiempo real

## 🗄️ Base de Datos

### Tablas Creadas

#### 1. `operaciones_produccion`
Registro principal de cada operación de producción.

**Campos clave:**
- `id` (UUID): Identificador único
- `pedido_id`: Pedido asociado
- `operador_id` / `operador_nombre`: Operador que ejecuta
- `maquina`: Máquina/estación de trabajo
- `estado`: en_progreso | pausada | completada | cancelada
- `fecha_inicio` / `fecha_fin`: Timestamps
- `tiempo_total_segundos`: Tiempo trabajado (sin pausas)
- `metros_producidos`: Metros completados en esta operación
- `observaciones`: Notas del operador

#### 2. `pausas_operacion`
Registro de cada pausa individual dentro de una operación.

**Campos clave:**
- `operacion_id`: Operación padre
- `fecha_inicio_pausa` / `fecha_fin_pausa`
- `duracion_segundos`: Calculado automáticamente
- `motivo`: Razón de la pausa

#### 3. `metraje_produccion`
Historial detallado de metros producidos.

**Campos clave:**
- `operacion_id` / `pedido_id`
- `metros_registrados`: Metros de este registro
- `metros_acumulados`: Total hasta este punto
- `calidad`: ok | defectuoso | merma
- `registrado_por` / `registrado_nombre`

#### 4. `observaciones_produccion`
Comentarios y notas durante la producción.

**Campos clave:**
- `operacion_id` / `pedido_id`
- `observacion`: Texto
- `tipo`: normal | problema | alerta | nota_calidad
- `creado_por` / `creado_nombre`

### Campos Nuevos en `pedidos`

- `operador_actual_id`: Operador trabajando actualmente
- `operador_actual_nombre`: Nombre del operador (desnormalizado)
- `operacion_en_curso_id`: ID de operación activa
- `metros_producidos`: Total de metros producidos (acumulado)
- `metros_restantes`: Campo calculado (metros - metros_producidos)
- `porcentaje_completado`: Campo calculado (0-100%)
- `tiempo_real_produccion_segundos`: Suma de todas las operaciones

### Triggers y Funciones

#### `actualizar_estadisticas_pedido()`
Trigger que se ejecuta automáticamente al actualizar una operación:
- Actualiza metros_producidos del pedido al completar
- Actualiza tiempo_real_produccion_segundos
- Limpia operador_actual al completar
- Asigna operador_actual al iniciar/pausar

#### `calcular_duracion_pausa()`
Calcula automáticamente la duración de pausas al finalizarlas.

### Vistas Útiles

#### `v_operaciones_activas`
Operaciones en progreso o pausadas con datos del pedido.

#### `v_estadisticas_operador_hoy`
Métricas del día actual por operador.

#### `v_pedidos_disponibles_produccion`
Pedidos listos para tomar, ordenados por prioridad.

## 🔌 API Endpoints

### Operaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/produccion/iniciar` | Iniciar nueva operación |
| POST | `/api/produccion/pausar/:id` | Pausar operación |
| POST | `/api/produccion/reanudar/:id` | Reanudar operación |
| POST | `/api/produccion/completar` | Completar operación |
| POST | `/api/produccion/cancelar/:id` | Cancelar operación |
| GET | `/api/produccion/operaciones-activas` | Listar operaciones activas |
| GET | `/api/produccion/operacion/:id` | Obtener operación por ID |

### Consultas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/produccion/pedidos-disponibles` | Pedidos listos para tomar |
| GET | `/api/produccion/historial/:pedidoId` | Historial de operaciones |
| GET | `/api/produccion/estadisticas/:operadorId` | Métricas del operador |
| GET | `/api/produccion/metraje/:pedidoId` | Historial de metraje |

### Observaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/produccion/observacion` | Agregar observación |
| GET | `/api/produccion/observaciones/:operacionId` | Listar observaciones |

## 📡 Eventos WebSocket

El sistema emite eventos en tiempo real para sincronización:

- `operacion-iniciada`: Nueva operación comenzó
- `operacion-pausada`: Operación fue pausada
- `operacion-reanudada`: Operación reanudada
- `operacion-completada`: Operación finalizada
- `operacion-cancelada`: Operación cancelada
- `observacion-agregada`: Nueva observación
- `metraje-registrado`: Nuevo registro de metraje

## 🎨 Componentes Frontend

### Vista Principal: `OperadorView.tsx`
Vista completa del modo operador con:
- Lista de pedidos disponibles
- Operación actual (si existe)
- Cronómetro en tiempo real
- Panel de métricas (colapsable)
- Filtros por máquina

### Componentes Auxiliares

1. **TarjetaPedidoOperador**: Card táctil para cada pedido
2. **FiltroMaquina**: Filtro visual de máquinas
3. **CronometroOperacion**: Contador de tiempo en vivo
4. **ModalIniciarOperacion**: Modal para seleccionar máquina
5. **ModalCompletarOperacion**: Modal para registrar metros y finalizar
6. **MetricasProduccionPanel**: KPIs del operador

### Hook: `useOperacionesProduccion.ts`

Hook personalizado que gestiona:
- Estado de operaciones activas
- Operación actual del usuario
- Estadísticas en tiempo real
- Suscripción a eventos Socket.IO
- Funciones para iniciar/pausar/reanudar/completar

## 🔐 Permisos

**Nuevo permiso agregado:**
- `pedidos.operate`: Permite acceder al modo operador de producción

Este permiso debe asignarse a los roles que trabajarán en producción (Operador, Supervisor, etc.)

## 🚀 Implementación Técnica

### Reglas de Negocio Implementadas

1. **Un pedido, una operación**: No se permite tener múltiples operaciones activas en el mismo pedido
2. **Un operador, una operación**: Cada operador solo puede tener una operación activa a la vez
3. **Producción incremental**: Se pueden hacer múltiples operaciones parciales en un pedido
4. **Tracking automático**: Los triggers actualizan el pedido automáticamente
5. **Pausas granulares**: Cada pausa se registra individualmente para cálculos precisos

### Características de Diseño

- **Responsive**: Funciona en desktop, tablets y móviles
- **Táctil**: Botones grandes (mín 44px) para uso en pantallas táctiles
- **Tiempo real**: Sincronización instantánea vía WebSocket
- **Offline-ready**: Preparado para modo offline futuro
- **Accesible**: Alto contraste, modo oscuro incluido

## 📊 Flujo de Trabajo

```
1. Operador accede a "Modo Operador"
2. Ve lista de pedidos disponibles (filtrados por prioridad)
3. Selecciona un pedido → Modal "Iniciar Operación"
4. Selecciona máquina → Operación comienza
5. Cronómetro inicia automáticamente
6. Durante trabajo:
   - Puede pausar (ej: almuerzo, problema técnico)
   - Puede reanudar
   - Puede agregar observaciones
7. Al finalizar → Modal "Completar Operación"
8. Ingresa metros producidos
9. Operación se completa → Pedido actualizado automáticamente
10. Métricas del operador se actualizan en tiempo real
```

## 📈 Métricas Disponibles

El panel de métricas muestra:
- **Operaciones hoy**: Total del día
- **Completadas**: Operaciones finalizadas
- **En progreso**: Operaciones activas
- **Pausadas**: Operaciones detenidas
- **Metros producidos**: Total del día
- **Tiempo trabajado**: Tiempo efectivo (sin pausas)
- **Promedio**: Tiempo medio por operación

## 🔧 Mantenimiento

### Migraciones

La migración `026-create-produccion-tracking.sql` es **idempotente**:
- Puede ejecutarse múltiples veces sin errores
- Usa `IF NOT EXISTS` en todas las creaciones
- Verifica existencia antes de modificar

### Monitoreo

Consultas útiles para monitoreo:

```sql
-- Operaciones activas
SELECT * FROM v_operaciones_activas;

-- Estadísticas del día
SELECT * FROM v_estadisticas_operador_hoy;

-- Pedidos disponibles
SELECT * FROM v_pedidos_disponibles_produccion;

-- Operaciones problemáticas (más de 2 horas)
SELECT * FROM operaciones_produccion 
WHERE estado IN ('en_progreso', 'pausada')
AND EXTRACT(EPOCH FROM (NOW() - fecha_inicio)) > 7200;
```

## 🐛 Troubleshooting

### Problema: Operación no inicia
- Verificar que no exista otra operación activa para ese pedido
- Verificar que el operador no tenga otra operación en curso
- Revisar logs del backend: "Error iniciando operación"

### Problema: Metros no se actualizan
- Verificar que el trigger `actualizar_estadisticas_pedido` esté activo
- Comprobar que la operación esté en estado 'completada'
- Revisar tabla `metraje_produccion` para ver registros

### Problema: WebSocket no sincroniza
- Verificar conexión socket en consola del navegador
- Comprobar que el backend emita los eventos
- Revisar firewall/proxy para websockets

## 📝 Notas Técnicas

- **Zona horaria**: Todos los timestamps usan `TIMESTAMPTZ` (UTC)
- **Precisión de metros**: `NUMERIC(10, 2)` permite hasta 99,999,999.99m
- **IDs**: UUIDs generados por PostgreSQL (`gen_random_uuid()`)
- **Cálculos**: Campos calculados usan `GENERATED ALWAYS AS ... STORED`

## 🎯 Próximas Mejoras Sugeridas

1. **Control de calidad**: Checkpoint de supervisión opcional
2. **Modo offline**: Sincronización posterior con Service Workers
3. **Notificaciones push**: Alertar cuando lleguen pedidos urgentes
4. **Reportes avanzados**: Análisis de eficiencia por máquina/operador
5. **Integración de escaneo**: Códigos QR/barras para identificar pedidos

---

✅ **Sistema completamente implementado y funcional**
