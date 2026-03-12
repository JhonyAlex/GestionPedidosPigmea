# 🛠️ Copilot Instructions: Reglas del Proyecto (Versión Simple)

Usa estas reglas para mantener la calidad y conexión del proyecto.

> 📚 **Guía extendida**: Para cambios en BD o componentes, consultar `.github/agents/database-and-components-guide.md`
> 🗂️ **Contexto BD (completo)**: `.github/agents/database-context-pedidos-full.md`
> ⚡ **Contexto BD (rápido)**: `.github/agents/database-context-pedidos-quick.md`

Antes de proponer cambios de esquema/datos SQL, revisar primero el contexto rápido y luego el completo si hay impacto estructural.

---

### ⚠️ 0. Regla de Confirmación (OBLIGATORIA)
* **Regla:** Antes de modificar BD, tipos compartidos o múltiples archivos, **DETENTE y confirma** con el usuario.
* **Por qué:** Previene errores colaterales en módulos no relacionados.
* **Acción:** Listar archivos afectados y pedir confirmación explícita.

---

### 🌐 1. Conexión al Servidor (API)
* **Regla:** Usa rutas relativas que empiecen con `/api`.
* **Por qué:** Evita errores de conexión cuando el proyecto se suba a internet (producción).
* **Código:**
    // ❌ MAL: fetch('http://localhost:8080/api/pedidos')
    // ✅ BIEN: fetch('/api/pedidos')

### 🔑 2. Identificación de Usuario (Autenticación)
* **Regla:** Incluye siempre los "Headers" de seguridad en cada petición `fetch`.
* **Por qué:** El servidor necesita saber quién eres y qué permisos tienes para no rechazar la orden.
* **Código:** headers: getAuthHeaders() // Importar desde los hooks de usuario

### 🗄️ 3. Cambios en Base de Datos (SQL)
* **Regla:** Todo cambio en las tablas debe ir en un archivo `.sql` dentro de `database/migrations/`.
* **Por qué:** Mantiene a todo el equipo sincronizado y evita que la base de datos se rompa al actualizar.
* **Instrucción:** Usa `ADD COLUMN IF NOT EXISTS` para evitar errores si el campo ya existe.

### 📣 4. Actualizaciones en Tiempo Real (WebSockets)
* **Regla:** Al crear, editar o borrar (CRUD), el Backend debe avisar a todos.
* **Por qué:** Permite que otros usuarios vean los cambios al instante sin refrescar la página.
* **Código:** io.emit('evento-update', data); // En el servidor

---

### 📝 Cómo pedir cambios (Plantilla de Prompt)
"Necesito [acción]. Recuerda aplicar:
1. Rutas /api (Regla 1).
2. Headers de auth (Regla 2).
3. Si hay cambios en DB, crear migración SQL (Regla 3).
4. Emitir evento Socket.IO al terminar (Regla 4)."