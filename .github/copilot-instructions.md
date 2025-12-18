# **📋 Instrucciones de IA \- Proyecto "Gestión Pedidos Pigmea"**

Sistema full-stack de gestión de pedidos con React/TypeScript (frontend), Node.js/Express (backend), PostgreSQL (base de datos), y Socket.IO (comunicación en tiempo real).

## **🏗️ Arquitectura del Sistema**

**Stack Tecnológico:**
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js 18 + Express + Socket.IO
- **Base de Datos:** PostgreSQL con migraciones SQL idempotentes
- **Despliegue:** Docker (multi-stage build) + Dokploy
- **Autenticación:** Header-based (x-user-id, x-user-role) con sistema de permisos granulares

**Flujo de Datos:**
1. Frontend hooks (ej. `usePedidosManager.ts`) → Fetch API con headers auth → Backend endpoints
2. Backend valida permisos → Ejecuta operaciones DB (con fallback en memoria) → Emite eventos Socket.IO
3. Frontend listeners (WebSocket) → Actualiza estado local React → Re-render automático

**Comunicación en Tiempo Real:**
- El backend emite eventos Socket.IO después de cada operación CRUD (ej. `io.emit('pedido-created', pedido)`)
- Los hooks del frontend se suscriben a estos eventos para sincronización en tiempo real
- Ver [backend/index.js](backend/index.js) líneas 2360+ para patrones de emisión de eventos

## **🛑 REGLAS DE ORO (¡Leer Siempre\!)**

Estas son las reglas más importantes. Ignorarlas causa los errores más comunes.

### **1\. 🌐 Red: ¡NO USAR localhost\!**

EL PROBLEMA: El frontend (React) y el backend (Node) corren en contenedores separados (Docker/Codespaces). El frontend NO puede acceder a http://localhost:8080 o http://localhost:3001.  
LA SOLUCIÓN: Todas las llamadas fetch deben usar rutas relativas que apunten al proxy /api.

* **SIEMPRE** usa esta constante en los hooks de React:  
  const API\_URL \= import.meta.env.VITE\_API\_URL || '/api';

* **Correcto:** fetch(\\${API\_URL}/pedidos\`)(Se resuelve a/api/pedidos\`)  
* **INCORRECTO:** fetch('http://localhost:8080/api/pedidos') (Causa net::ERR\_CONNECTION\_REFUSED)

### **2\. 🔑 Autenticación: ¡SIEMPRE Enviar Headers\!**

EL PROBLEMA: La IA olvida que la API está protegida y no envía autenticación.  
LA SOLUCIÓN: CADA petición fetch al backend debe incluir los headers de autenticación.

* **Headers Requeridos:**  
  * 'x-user-id': ID del usuario.  
  * 'x-user-role': Rol del usuario.  
* **Patrón a Seguir:** Al crear un nuevo hook (ej. useMiManager.ts), **DEBES** copiar el patrón de useVendedoresManager.ts o useComments.ts:  
  1. Importar useAuth: const { user } \= useAuth();  
  2. Crear la función getAuthHeaders():  
     const getAuthHeaders \= () \=\> ({  
       'x-user-id': String(user.id),  
       'x-user-role': user.role || 'OPERATOR',  
       'Content-Type': 'application/json'  
     });

  3. Usarla en fetch: headers: getAuthHeaders()

### **3\. 🗃️ Base de Datos: ¡MIGRACIONES SQL Obligatorias\!**

EL PROBLEMA: La IA intenta modificar el esquema de la BBDD directamente.  
LA SOLUCIÓN: El esquema SÓLO se modifica mediante migraciones SQL. El backend las aplica automáticamente al arrancar.

* **Regla:** **NUNCA** modificar la BBDD. **SIEMPRE** crear un nuevo archivo de migración.  
* **Ubicación:** database/migrations/ (ej. 016-add-nuevo-campo.sql)  
* **Script de Ejecución:** **¡CRÍTICO\!** Después de crear el archivo .sql, debes añadirlo al script backend/run-migrations.sh para que se ejecute en el próximo deploy.
* **⚠️ MIGRACIONES IDEMPOTENTES:** Todas las migraciones **DEBEN** ser idempotentes (ejecutables múltiples veces sin error). **SIEMPRE** usar:
  * `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
  * `CREATE INDEX IF NOT EXISTS ...`
  * `DO $$ BEGIN ... IF EXISTS (...) THEN ... END IF; END $$;`
* **⚠️ RENOMBRAR COLUMNAS:** Al renombrar columnas, **SIEMPRE** verificar primero si existe:
  ```sql
  DO $$ 
  BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tabla' AND column_name = 'nombre_viejo') THEN
          ALTER TABLE tabla RENAME COLUMN nombre_viejo TO nombre_nuevo;
      END IF;
  END $$;
  ```

### **3.1. 🔗 Foreign Keys: ¡SIEMPRE Validar Existencia\!**

EL PROBLEMA: El código intenta insertar/actualizar con foreign keys que no existen, causando errores como `violates foreign key constraint`.  
LA SOLUCIÓN: **SIEMPRE** validar que el registro relacionado existe antes de usar su ID.

* **Patrón Obligatorio en postgres-client.js:**
  ```javascript
  // ✅ CORRECTO: Validar antes de usar
  if (pedido.vendedorId) {
      const vendedorResult = await client.query(
          'SELECT nombre FROM vendedores WHERE id = $1', 
          [pedido.vendedorId]
      );
      if (vendedorResult.rowCount > 0) {
          pedido.vendedorNombre = vendedorResult.rows[0].nombre;
      } else {
          console.warn(`⚠️ Vendedor ${pedido.vendedorId} no encontrado.`);
          pedido.vendedorId = null;  // Establecer como null si no existe
      }
  }
  
  // ❌ INCORRECTO: Usar directamente sin validar
  if (pedido.vendedorId) {
      pedido.vendedorNombre = await getNombre(pedido.vendedorId);
  }
  ```
* **Regla:** Si una foreign key no existe, establecer el campo como `null` en lugar de fallar.

### **4\. ⚙️ Entorno de Desarrollo: Backend sin BBDD**

EL PROBLEMA: La IA asume que la BBDD siempre está conectada.  
LA SOLUCIÓN: El backend (backend/index.js) está programado para funcionar sin conexión a PostgreSQL usando almacenamiento en memoria (ej. vendedoresMemory, clientesMemory).

* **Regla:** Al crear nuevos endpoints, **DEBES** replicar este patrón: intentar la operación de BBDD y, si falla, usar el *store* en memoria.

### **5\. 🔄 Comunicación Tiempo Real: WebSocket Obligatorio**

EL PROBLEMA: La IA olvida emitir eventos Socket.IO, causando que otros usuarios no vean cambios en tiempo real.  
LA SOLUCIÓN: **CADA** endpoint CRUD debe emitir el evento Socket.IO correspondiente.

* **Patrón Obligatorio en backend/index.js:**
  ```javascript
  // ✅ CORRECTO: Después de crear/actualizar/eliminar
  app.post('/api/pedidos', async (req, res) => {
      const newPedido = await dbClient.createPedido(data);
      io.emit('pedido-created', newPedido); // ← ¡CRÍTICO!
      res.json(newPedido);
  });
  ```
* **Eventos Estándar:** `{entity}-created`, `{entity}-updated`, `{entity}-deleted`
* **Regla:** En el frontend, los hooks **DEBEN** suscribirse a estos eventos (ver patrón en [hooks/usePedidosManager.ts](hooks/usePedidosManager.ts) líneas 47-90).

## **🚨 Errores Comunes y Soluciones**

### **Error 1: "violates foreign key constraint"**
**Causa:** Intentar insertar/actualizar un registro con un ID de foreign key que no existe en la tabla relacionada.  
**Solución:** Validar siempre que el registro relacionado existe antes (ver Regla 3.1).  
**Ejemplo:**
```javascript
// ✅ CORRECTO
if (pedido.vendedorId) {
    const result = await client.query('SELECT id FROM vendedores WHERE id = $1', [pedido.vendedorId]);
    if (result.rowCount === 0) {
        pedido.vendedorId = null; // Establecer como null si no existe
    }
}
```

### **Error 2: "column does not exist" en migraciones**
**Causa:** Migración intenta renombrar o modificar una columna que no existe.  
**Solución:** SIEMPRE verificar si la columna existe antes de modificarla.  
**Ejemplo:**
```sql
-- ✅ CORRECTO: Migración idempotente
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'pedidos' AND column_name = 'campo_viejo') THEN
        ALTER TABLE pedidos RENAME COLUMN campo_viejo TO campo_nuevo;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'pedidos' AND column_name = 'campo_nuevo') THEN
        ALTER TABLE pedidos ADD COLUMN campo_nuevo VARCHAR(255);
    END IF;
END $$;
```

### **Error 3: "relation already exists" o "column already exists"**
**Causa:** Migración no es idempotente y falla al ejecutarse por segunda vez.  
**Solución:** Usar siempre `IF NOT EXISTS` o bloques `DO $$ BEGIN ... END $$;` con verificación.  
**Ejemplo:**
```sql
-- ✅ CORRECTO
CREATE TABLE IF NOT EXISTS mi_tabla (...);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mi_campo VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_mi_indice ON pedidos(mi_campo);
```

## **🏗️ Flujo de Trabajo 1: Añadir un Nuevo Campo a pedidos**

Este es el checklist **en orden exacto** para añadir un nuevo campo (ej. mi\_campo\_nuevo):

1. **types.ts**: Añadir la propiedad a la interfaz Pedido (ej. miCampoNuevo?: string;).  
2. **database/migrations/0XX-add\_mi\_campo\_nuevo.sql**: Crear el **NUEVO** archivo SQL.  
   ```sql
   -- Migración: 0XX-add_mi_campo_nuevo.sql
   ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mi_campo_nuevo VARCHAR(255);
   ```
   **⚠️ IMPORTANTE:** Usar `IF NOT EXISTS` para que sea idempotente (Regla 3).

3. **backend/run-migrations.sh**: **¡CRÍTICO\!** Añadir la ruta al nuevo archivo SQL en este script para que se ejecute.  
4. **backend/postgres-client.js**: Añadir el nuevo campo (ej. mi\_campo\_nuevo) a las funciones create (sección INSERT) y update (sección UPDATE).  
   * **⚠️ Si es una Foreign Key:** Validar que el registro existe antes de usarlo (ver Regla 3.1).
5. **components/AddPedidoModal.tsx**: Añadir el campo al estado initialFormData y al JSX del formulario.  
6. **components/PedidoModal.tsx**: Añadir el campo al JSX del formulario (para edición).  
7. **app/Models/Pedido.php**: (Legado PHP) Añadir el nombre del campo al array $fillable.  
8. **hooks/usePedidosManager.ts**: (Opcional) Si el campo debe auditarse, añadirlo al array AUDITABLE\_FIELDS.

## **🛠️ Flujo de Trabajo 2: Crear un Nuevo CRUD (Ej: "Materiales")**

Este es el checklist para crear una nueva entidad desde cero.

1. **Tipos:** types.ts (Crear nueva interfaz Material, MaterialInput).  
2. **DB (SQL):** database/migrations/0XX-create\_materiales.sql (Crear la nueva tabla).  
3. **DB (Script):** Añadir la nueva migración 0XX-create\_materiales.sql a backend/run-migrations.sh (**Regla 3**).  
4. **Backend (Lógica):** backend/postgres-client.js (Añadir funciones: createMaterial, getMateriales, updateMaterial, deleteMaterial).  
5. **Backend (API):** backend/index.js (Añadir los 5 endpoints CRUD para /api/materiales).  
6. **Backend (Auth):** Proteger los nuevos endpoints con authenticateUser y requirePermission().  
7. **Backend (Dev):** Añadir un *store* en memoria (ej. materialesMemory) en index.js para que funcione sin BBDD (**Regla 4**).  
8. **Backend (Real-time):** En los endpoints de index.js, emitir los eventos io.emit('material-created', ...), io.emit('material-updated', ...) después de cada operación.  
9. **Frontend (Hook):** Crear hooks/useMaterialesManager.ts.  
10. **Frontend (Hook-Reglas):** Este hook **DEBE** usar const API\_URL \= '/api' (**Regla 1**) y **DEBE** incluir getAuthHeaders() en cada fetch (**Regla 2**).

## **💡 Plantilla de Prompt (Cómo Pedirme Tareas)**

Usa este formato para asegurar que sigo las reglas.

**❌ MALO (Causa errores):**

"Crea un CRUD para 'Materiales'"

**✅ BUENO (Evita errores):**

"Necesito implementar un CRUD completo para 'Materiales'.

**Archivos a crear/modificar:**

1. types.ts (Interfaz Material)  
2. database/migrations/0XX-create\_materiales.sql (NUEVO)  
3. backend/run-migrations.sh (Añadir el nuevo SQL)  
4. backend/postgres-client.js (Funciones CRUD)  
5. backend/index.js (Endpoints API)  
6. hooks/useMaterialesManager.ts (NUEVO)

**Recordatorios Importantes:**

* En useMaterialesManager.ts, usa const API\_URL \= '/api' (Regla 1).  
* En useMaterialesManager.ts, copia el patrón de useVendedoresManager.ts para los headers de auth x-user-id (Regla 2).  
* En index.js, añade un fallback en memoria para 'materiales' (Regla 4).  
* En index.js, emite eventos de socket.io para material-created/updated/deleted."

---

## **🔧 Comandos y Scripts Clave**

### **Desarrollo Local:**
```bash
# Frontend (ejecutar en raíz del proyecto)
npm run dev              # Inicia Vite dev server en :5173

# Backend (ejecutar en /backend)
cd backend && npm start  # Inicia Express server en :8080

# Base de Datos
cd backend && sh run-migrations.sh  # Aplicar migraciones (requiere PostgreSQL)
```

### **Docker (Producción/Testing):**
```bash
# Build y deploy
docker build -t gestor-pedidos .
docker run -p 8080:8080 --env-file .env gestor-pedidos

# Ver logs
docker logs -f <container-id>
```

### **Debugging:**
- **Health Check:** `curl http://localhost:8080/health` (muestra estado DB + WebSocket)
- **Debug Users:** `curl http://localhost:8080/api/debug/users` (lista usuarios en DB)
- **Ver migraciones aplicadas:** Verifica logs del backend al iniciar

---

## **📁 Estructura de Archivos Críticos**

```
/
├── types.ts                        # ⭐ Tipos TypeScript compartidos (Pedido, Cliente, etc.)
├── constants.ts                    # Enums de etapas, estados, permisos
├── vite.config.ts                  # Proxy /api → localhost:8080
├── Dockerfile                      # Multi-stage: build React + run Node + migrations
│
├── backend/
│   ├── index.js                    # ⭐ Servidor Express principal (endpoints + Socket.IO)
│   ├── postgres-client.js          # ⭐ Cliente PostgreSQL con fallback en memoria
│   ├── run-migrations.sh           # ⭐ Script que ejecuta todas las migraciones SQL
│   ├── middleware/
│   │   ├── auth.js                 # Autenticación header-based (x-user-id)
│   │   └── permissions.js          # Middleware requirePermission()
│   └── permissions-map.json        # Mapeo de permisos por rol
│
├── hooks/
│   ├── usePedidosManager.ts        # ⭐ Patrón de referencia para hooks CRUD
│   ├── useVendedoresManager.ts     # ⭐ Ejemplo completo de auth headers + WebSocket
│   └── useClientesManager.ts
│
├── contexts/
│   └── AuthContext.tsx             # Context de autenticación con sincronización de permisos
│
├── services/
│   ├── storage.ts                  # Capa de abstracción API (fetch con reintentos)
│   └── websocket.ts                # Cliente Socket.IO con subscriptores
│
└── database/migrations/
    ├── 000-create-pedidos-table.sql
    ├── 001-add-clientes-system.sql
    └── 0XX-*.sql                   # Migraciones idempotentes (IF NOT EXISTS)
```

---

## **🎯 Patrones Específicos del Proyecto**

### **1. Arquitectura de Permisos:**
- **Backend:** Middleware `requirePermission('pedidos.create')` en cada endpoint
- **Frontend:** Context `useAuth()` provee `user.permissions[]`
- **Mapeo:** Ver [backend/permissions-map.json](backend/permissions-map.json) para permisos por rol
- **Ejemplo:** Admin tiene `usuarios.admin`, Operador tiene `pedidos.create`

### **2. Flujo de Autenticación (Header-Based):**
```typescript
// Frontend (hooks/useVendedoresManager.ts)
const getAuthHeaders = () => ({
    'x-user-id': String(user.id),
    'x-user-role': user.role || 'OPERATOR',
    'x-user-permissions': JSON.stringify(user.permissions),
    'Content-Type': 'application/json'
});

fetch(`${API_URL}/vendedores`, { headers: getAuthHeaders() });
```

```javascript
// Backend (middleware/auth.js)
const authenticateUser = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const user = await db.getAdminUserById(userId);
    req.user = user; // Adjunta al request
    next();
};
```

### **3. Patrón de Migraciones Idempotentes:**
Todas las migraciones en `database/migrations/` **DEBEN** ser ejecutables múltiples veces:
```sql
-- ✅ CORRECTO
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mi_campo VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_mi_campo ON pedidos(mi_campo);

-- ✅ CORRECTO (renombrado condicional)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'pedidos' AND column_name = 'campo_viejo') THEN
        ALTER TABLE pedidos RENAME COLUMN campo_viejo TO campo_nuevo;
    END IF;
END $$;
```

### **4. Patrón de Hook Manager (CRUD + WebSocket):**
Ver [hooks/usePedidosManager.ts](hooks/usePedidosManager.ts) como referencia completa:
1. Estado local con `useState<Pedido[]>`
2. `useEffect` inicial para fetch de datos
3. Funciones CRUD que llaman a `/api/*` con `getAuthHeaders()`
4. `useEffect` para suscribirse a eventos WebSocket (`pedido-created`, etc.)
5. Actualización optimista del estado local

### **5. Proxy Vite (Development):**
[vite.config.ts](vite.config.ts) configura proxy para evitar CORS:
```typescript
server: {
    proxy: {
        '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true
        }
    }
}
```
Por eso **SIEMPRE** usamos `const API_URL = '/api'` en hooks, no `localhost:8080`.

---

## **⚠️ Anti-Patrones Comunes**

| ❌ **NO HACER** | ✅ **HACER** |
|----------------|-------------|
| `fetch('http://localhost:8080/api/pedidos')` | `fetch(\`${API_URL}/pedidos\`)` donde `API_URL = '/api'` |
| Crear endpoint sin `requirePermission()` | `app.post('/api/pedidos', requirePermission('pedidos.create'), ...)` |
| Modificar DB schema directamente | Crear migración SQL en `database/migrations/` |
| Olvidar `io.emit()` después de CRUD | Siempre emitir evento después de operación |
| Migración sin `IF NOT EXISTS` | Usar `IF NOT EXISTS` en ALTER/CREATE |
| Foreign key sin validar existencia | Verificar que el registro relacionado existe antes |
| Hook sin `getAuthHeaders()` | Copiar patrón de `useVendedoresManager.ts` |

---

## **🐛 Debugging Tips**

1. **Frontend no recibe datos:** Verifica headers en DevTools Network → Debe tener `x-user-id` y `x-user-role`
2. **Error 503 "Database not available":** Verifica `docker logs` del contenedor PostgreSQL
3. **Cambios no se sincronizan:** Abre DevTools → Network → WS → Verifica que Socket.IO está conectado
4. **Migración falla:** Verifica que el archivo está en `backend/run-migrations.sh` y es idempotente
5. **Foreign key constraint error:** Verifica que el registro relacionado existe (ver Regla 3.1)

---

## **📚 Referencias Rápidas**

- **Tipos principales:** [types.ts](types.ts) - `Pedido`, `Cliente`, `Vendedor`, `Etapa`, etc.
- **Permisos disponibles:** [constants/permissions.ts](constants/permissions.ts)
- **Ejemplo completo de hook:** [hooks/useVendedoresManager.ts](hooks/useVendedoresManager.ts)
- **Ejemplo completo de endpoint:** [backend/index.js](backend/index.js) líneas 2900-3050 (CRUD clientes)
- **Documentación adicional:** [docs/README.md](docs/README.md)