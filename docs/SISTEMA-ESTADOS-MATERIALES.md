# 📦 Sistema de Estados y Colores para Gestión de Materiales

## 📊 Resumen Visual del Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DE UN MATERIAL                 │
└─────────────────────────────────────────────────────────────────┘

   CREACIÓN          GESTIÓN          RECEPCIÓN
      │                 │                 │
      ▼                 ▼                 ▼
   ┌──────┐        ┌──────┐          ┌──────┐
   │ AZUL │   →    │ ROJO │    →     │VERDE │
   └──────┘        └──────┘          └──────┘
      🕑              ⏳                ✅
  Pendiente      En Camino         Completado
  Gestión         (Pedido)         (Recibido)
```

## 🎨 Definición de Estados

### Estado 1: 🔵 AZUL (Inicial)
- **Condición:** `pendienteGestion = true` AND `pendienteRecibir = true`
- **Significado:** El material aún no ha sido pedido al proveedor
- **Etiquetas:**
  - ✅ **Sin marcar:** Gestionado
  - ✅ **Sin marcar:** Material Recibido
- **Color de fondo:** `bg-blue-100 dark:bg-blue-900`
- **Icono:** 🕑
- **Label:** "Pendiente Gestión"

### Estado 2: 🔴 ROJO (En Camino)
- **Condición:** `pendienteGestion = false` AND `pendienteRecibir = true`
- **Significado:** Ya se gestionó con el proveedor, esperando llegada
- **Etiquetas:**
  - ✅ **Marcado:** Gestionado
  - ✅ **Sin marcar:** Material Recibido
- **Color de fondo:** `bg-red-100 dark:bg-red-900`
- **Icono:** ⏳
- **Label:** "Pendiente de Recibir"

### Estado 3: 🟢 VERDE (Finalizado)
- **Condición:** `pendienteRecibir = false` (automáticamente `pendienteGestion = false`)
- **Significado:** El material ha sido recibido y está disponible
- **Etiquetas:**
  - ✅ **Marcado:** Gestionado (automático)
  - ✅ **Marcado:** Material Recibido
- **Color de fondo:** `bg-green-100 dark:bg-green-900`
- **Icono:** ✅
- **Label:** "Material Recibido"

## 🔄 Reglas de Transición

### Regla 1: Creación (Default)
```javascript
// Todo material nuevo se crea en estado AZUL
{
  pendienteGestion: true,
  pendienteRecibir: true
}
```

### Regla 2: Gestión Manual
```javascript
// Usuario marca "✅ Gestionado"
pendienteGestion: true → false
// Resultado: AZUL → ROJO
```

### Regla 3: Recepción Automática ⚡
```javascript
// Usuario marca "✅ Material Recibido"
pendienteRecibir: true → false
pendienteGestion: AUTOMÁTICAMENTE → false
// Resultado: ROJO/AZUL → VERDE
```

### Regla 4: Reversión
```javascript
// Usuario desmarca "Material Recibido"
pendienteRecibir: false → true
// El color vuelve a ROJO (si estaba gestionado) o AZUL (si no)
```

## 💻 Implementación Técnica

### Base de Datos (PostgreSQL)
```sql
-- Migración: 027-create-materiales-table.sql
CREATE TABLE materiales (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    pendiente_recibir BOOLEAN DEFAULT true NOT NULL,
    pendiente_gestion BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Backend (Node.js + Express)
**Archivo:** `backend/index.js` líneas 3336-3338

```javascript
// Regla de Recepción Automática
if (updates.pendienteRecibir === false) {
    updates.pendienteGestion = false;
}
```

### Frontend (React + TypeScript)

#### Tipos (types/material.ts)
```typescript
export interface Material {
    id: number;
    numero: string;
    descripcion?: string;
    pendienteRecibir: boolean;
    pendienteGestion: boolean;
    createdAt?: string;
    updatedAt?: string;
}
```

#### Función de Tema (components/PedidoCard.tsx)
```typescript
const getMaterialTheme = (material: Material) => {
    // VERDE: Material recibido
    if (material.pendienteRecibir === false) {
        return { bg: 'bg-green-100', icon: '✅', label: 'Material Recibido' };
    }
    
    // AZUL: Pendiente de gestión
    if (material.pendienteGestion === true) {
        return { bg: 'bg-blue-100', icon: '🕑', label: 'Pendiente Gestión' };
    }
    
    // ROJO: Gestionado pero no recibido
    return { bg: 'bg-red-100', icon: '⏳', label: 'Pendiente de Recibir' };
};
```

#### Controles UI (components/PedidoModal.tsx)
```tsx
{/* Checkbox: Gestionado */}
<input
    type="checkbox"
    checked={!material.pendienteGestion}
    onChange={(e) => handleMaterialStateChange(material.id, 'pendienteGestion', e.target.checked)}
    disabled={!material.pendienteRecibir}
/>

{/* Checkbox: Material Recibido */}
<input
    type="checkbox"
    checked={!material.pendienteRecibir}
    onChange={(e) => handleMaterialStateChange(material.id, 'pendienteRecibir', e.target.checked)}
/>
```

**Nota:** Los checkboxes representan el estado **completado**, por eso invertimos el valor (`checked={!material.pendienteGestion}`)

## 📱 Experiencia de Usuario (UX)

### Flujo Típico

1. **Comprador crea material nuevo:**
   - Sistema crea con `pendienteGestion=true`, `pendienteRecibir=true`
   - Badge muestra: **🔵 AZUL** "🕑 Pendiente Gestión"
   - Checkboxes: ☐ Gestionado | ☐ Material Recibido

2. **Comprador contacta al proveedor:**
   - Marca checkbox "✅ Gestionado"
   - Sistema actualiza `pendienteGestion=false`
   - Badge cambia a: **🔴 ROJO** "⏳ Pendiente de Recibir"
   - Checkboxes: ☑ Gestionado | ☐ Material Recibido

3. **Material llega al almacén:**
   - Marca checkbox "✅ Material Recibido"
   - Sistema actualiza `pendienteRecibir=false` y **automáticamente** `pendienteGestion=false`
   - Badge cambia a: **🟢 VERDE** "✅ Material Recibido"
   - Checkboxes: ☑ Gestionado | ☑ Material Recibido (ambos bloqueados en vista readonly)

### Mensajes de Ayuda

| Estado | Mensaje |
|--------|---------|
| VERDE | 💡 Material recibido y marcado automáticamente como gestionado |
| ROJO | ⏳ Pedido realizado al proveedor - En espera de recepción |
| AZUL | (Sin mensaje - estado inicial) |

## 🔍 Debugging y Validación

### Verificar Estado en DevTools
```javascript
// Consola del navegador
console.log({
  material: 'Material-001',
  pendienteRecibir: false, // ✅ Recibido
  pendienteGestion: false, // ✅ Gestionado (automático)
  expectedColor: 'VERDE'
});
```

### Verificar en Base de Datos
```sql
SELECT 
    numero,
    CASE 
        WHEN NOT pendiente_recibir THEN '🟢 VERDE - Recibido'
        WHEN pendiente_gestion THEN '🔵 AZUL - Pendiente Gestión'
        ELSE '🔴 ROJO - En Camino'
    END as estado_visual
FROM materiales
ORDER BY created_at DESC;
```

## 📚 Referencias Relacionadas

- **Migración SQL:** [database/migrations/027-create-materiales-table.sql](../database/migrations/027-create-materiales-table.sql)
- **Tipos TypeScript:** [types/material.ts](../types/material.ts)
- **Backend API:** [backend/index.js](../backend/index.js) líneas 3280-3400
- **Frontend Components:**
  - [components/PedidoCard.tsx](../components/PedidoCard.tsx) - Visualización en tarjetas
  - [components/PedidoModal.tsx](../components/PedidoModal.tsx) - Edición de estados
- **Hook Manager:** [hooks/useMaterialesManager.ts](../hooks/useMaterialesManager.ts)

## ✅ Checklist de Implementación

- [x] Migración SQL creada (027-create-materiales-table.sql)
- [x] Tipos TypeScript definidos (types/material.ts)
- [x] Backend endpoints CRUD (/api/materiales)
- [x] Backend regla de recepción automática
- [x] Frontend hook useMaterialesManager
- [x] Frontend función getMaterialTheme (PedidoCard.tsx)
- [x] Frontend función getMaterialTheme (PedidoModal.tsx)
- [x] Frontend controles UI (checkboxes)
- [x] Lógica de inversión de checkboxes (UX mejorada)
- [x] Mensajes de ayuda contextuales
- [x] Documentación del sistema

---

**Última actualización:** 2025-12-19  
**Versión:** 1.0
