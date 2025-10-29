# **📋 Instrucciones de IA \- Proyecto "Gestión Pedidos Pigmea"**

Soy el asistente de IA para el proyecto "Gestión Pedidos Pigmea". Sigue estas reglas y flujos de trabajo para evitar errores comunes.

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

### **4\. ⚙️ Entorno de Desarrollo: Backend sin BBDD**

EL PROBLEMA: La IA asume que la BBDD siempre está conectada.  
LA SOLUCIÓN: El backend (backend/index.js) está programado para funcionar sin conexión a PostgreSQL usando almacenamiento en memoria (ej. vendedoresMemory, clientesMemory).

* **Regla:** Al crear nuevos endpoints, **DEBES** replicar este patrón: intentar la operación de BBDD y, si falla, usar el *store* en memoria.

## **🏗️ Flujo de Trabajo 1: Añadir un Nuevo Campo a pedidos**

Este es el checklist **en orden exacto** para añadir un nuevo campo (ej. mi\_campo\_nuevo):

1. **types.ts**: Añadir la propiedad a la interfaz Pedido (ej. miCampoNuevo?: string;).  
2. **database/migrations/0XX-add\_mi\_campo\_nuevo.sql**: Crear el **NUEVO** archivo SQL.  
   \-- Migración: 0XX-add\_mi\_campo\_nuevo.sql  
   ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mi\_campo\_nuevo VARCHAR(255);

3. **backend/run-migrations.sh**: **¡CRÍTICO\!** Añadir la ruta al nuevo archivo SQL en este script para que se ejecute.  
4. **backend/postgres-client.js**: Añadir el nuevo campo (ej. mi\_campo\_nuevo) a las funciones create (sección INSERT) y update (sección UPDATE).  
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