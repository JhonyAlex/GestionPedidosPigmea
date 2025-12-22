Soporte: Sistema de Permisos Simplificado (v1.0)
============================================================

## 📋 Tabla de Accesos por Rol

### 👑 ADMINISTRADOR
✅ Acceso total a todo el sistema
- Todas las vistas
- Gestión de usuarios
- Configuración
- Auditoría

### 👔 SUPERVISOR
✅ Vistas:
- Pedidos (crear, editar, eliminar, mover)
- Clientes (crear, editar, eliminar)
- Vendedores (crear, editar, eliminar)
- Preparación (ver y gestionar)
- Listo Producción (ver y gestionar)
- Reportes (ver y exportar)

❌ Bloqueado:
- Gestión de Usuarios
- Configuración del Sistema
- Auditoría detallada

### 🔧 OPERADOR
✅ Vistas:
- Pedidos (ver y editar campos de operación)
- Operador Producción (especial para producción)
- Preparación (ver y trabajar)
- Listo Producción (ver y trabajar)

❌ Bloqueado:
- Clientes
- Vendedores
- Reportes
- Usuarios
- Configuración
- Auditoría

### 👁️ VISUALIZADOR
✅ Solo lectura:
- Pedidos (solo ver, no editar)
- Clientes (solo ver, no editar)
- Reportes (solo ver, no exportar)

❌ Bloqueado:
- Crear/editar/eliminar cualquier cosa
- Operador Producción
- Usuarios
- Configuración
- Auditoría

---

## 🔑 Permisos Internos (Para Código)

### Permisos de Vista (vista.*)
- `vista.pedidos` - Acceso a Pedidos
- `vista.clientes` - Acceso a Clientes
- `vista.vendedores` - Acceso a Vendedores
- `vista.operador` - Acceso a Operador Producción
- `vista.preparacion` - Acceso a Preparación
- `vista.listo_produccion` - Acceso a Listo Producción
- `vista.reportes` - Acceso a Reportes

### Permisos de Administración (admin.*)
- `admin.usuarios` - Gestionar usuarios y permisos
- `admin.configuracion` - Acceso a configuración
- `admin.auditoria` - Ver logs de auditoría

---

## 🛠️ Uso en Código (React)

```typescript
import { usePermissions } from '../hooks/usePermissions';

const MiComponente = () => {
    const { canViewPedidos, canManageUsers, isAdmin } = usePermissions();

    // Mostrar solo si tiene acceso
    if (!canViewPedidos()) return <div>Sin acceso</div>;

    // Deshabilitar botones según permisos
    <button disabled={!canManageUsers()}>Administrar</button>

    // Verificar rol directo
    if (isAdmin()) { /* solo admin */ }
};
```

---

## ✅ Cambios Principales (vs Sistema Antiguo)

❌ ANTES: 30+ permisos granulares
- pedidos.view, pedidos.edit, pedidos.delete, pedidos.move, pedidos.archive...
- clientes.view, clientes.create, clientes.edit, clientes.delete...
- usuarios.view, usuarios.create, usuarios.edit, usuarios.delete, usuarios.permissions...

✅ AHORA: 11 permisos por vistas
- vista.pedidos, vista.clientes, vista.vendedores, vista.operador, vista.preparacion, vista.listo_produccion, vista.reportes, vista.auditoria
- admin.usuarios, admin.configuracion, admin.auditoria

**Ventajas:**
- Más fácil entender quién accede a qué
- Menos combinaciones confusas de permisos
- Si un usuario puede ver Pedidos, puede hacer TODO en Pedidos
- Más fácil de mantener

---

## 🚨 Si un Usuario Dice "No Tengo Acceso"

1. Verifica su rol: Menu > Usuarios > [Buscar usuario]
2. Confirma que su rol tiene acceso a esa vista:
   - Supervisor: No tiene acceso a Usuarios, Configuración
   - Operador: Solo tiene Pedidos, Operador Producción, Preparación, Listo Producción
   - Visualizador: Solo lectura en Pedidos, Clientes, Reportes

3. Si necesita acceso, cámbialo a un rol con más permisos o crea un rol personalizado

---

## ⚙️ Cambiar Acceso de un Usuario

1. Ir a Menu > Usuarios > [Buscar usuario]
2. Cambiar su Rol a uno con más/menos permisos
3. O, hacer clic en "Permisos" para dar acceso a vistas específicas

---

Última actualización: 22/12/2025
