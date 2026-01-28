# Implementación: Checkbox de Antivaho Realizado

**Fecha**: 2026-01-28  
**Autor**: Sistema  
**Tipo**: Feature - Mejora de UX para proceso de antivaho en producción

---

## 📋 Resumen

Se implementó un checkbox para marcar el antivaho como "Hecho" para pedidos que ya están en producción. Esto permite a los usuarios gestionar mejor el flujo de trabajo del proceso de antivaho sin interferir con la secuencia especial de post-impresión.

## 🎯 Objetivo

Permitir a los operadores marcar manualmente cuando el proceso de antivaho ha sido completado en pedidos que están en las etapas de producción (Impresión o Post-Impresión), sin necesidad de pasar por el modal de confirmación cada vez.

## ✅ Cambios Realizados

### 1. **Frontend - PedidoModal.tsx**

Se agregó un checkbox condicional que:
- ✅ Solo aparece cuando `antivaho = true`
- ✅ Solo se muestra en etapas de producción (NO en PREPARACION, ARCHIVADO o COMPLETADO)
- ✅ Muestra "Pendiente" (amarillo) o "Hecho ✓" (verde) según el estado
- ✅ Permite al usuario marcar/desmarcar el estado del antivaho realizado

**Ubicación**: Debajo de los checkboxes de características del pedido

```tsx
{formData.antivaho && 
 formData.etapaActual !== Etapa.PREPARACION && 
 formData.etapaActual !== Etapa.ARCHIVADO && 
 formData.etapaActual !== Etapa.COMPLETADO && (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
            <input 
                type="checkbox" 
                id="antivahoRealizado" 
                name="antivahoRealizado" 
                checked={!!formData.antivahoRealizado} 
                onChange={handleChange} 
                className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500" 
            />
            <label htmlFor="antivahoRealizado">
                Antivaho: <span className={formData.antivahoRealizado ? 'text-green-600' : 'text-yellow-600'}>
                    {formData.antivahoRealizado ? 'Hecho ✓' : 'Pendiente'}
                </span>
            </label>
        </div>
    </div>
)}
```

### 2. **Base de Datos - Migración 036**

Se creó la migración `036-add-antivaho-realizado.sql` que agrega:
- ✅ Columna `antivaho_realizado` (BOOLEAN, DEFAULT FALSE)
- ✅ Comentario descriptivo de la columna
- ✅ Índice optimizado para consultas de antivaho pendiente

**Archivo**: `database/migrations/036-add-antivaho-realizado.sql`

```sql
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS antivaho_realizado BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_pedidos_antivaho_realizado 
ON pedidos(antivaho_realizado) 
WHERE antivaho = TRUE AND antivaho_realizado = FALSE;
```

### 3. **Backend - postgres-client.js**

Se actualizaron los métodos `create` y `update` para soportar la nueva columna:

**Método `create`**:
- ✅ Agregado `'antivaho_realizado'` a la lista de columnas opcionales
- ✅ Manejo dinámico de la columna (compatibilidad hacia atrás)

**Método `update`**:
- ✅ Verificación dinámica de existencia de columna
- ✅ Actualización del valor `antivahoRealizado` desde el objeto pedido
- ✅ Incluido en la query de UPDATE

### 4. **Script de Migración - PowerShell**

Se creó `aplicar-migracion-036.ps1` para aplicar la migración de manera segura.

**Uso**:
```powershell
.\aplicar-migracion-036.ps1
```

## 🔄 Flujo de Trabajo

### Antes (Sin checkbox):
1. Pedido con antivaho en PREPARACION
2. Se envía a impresión → Va a Post-Impresión
3. Cada cambio de etapa requiere confirmación del modal de antivaho
4. Puede ser tedioso para operadores

### Ahora (Con checkbox):
1. Pedido con antivaho en PREPARACION
2. Se envía a impresión → Va a Post-Impresión (secuencia especial)
3. **Usuario puede marcar "Antivaho: Hecho" en cualquier momento**
4. Al guardar, el pedido puede continuar la secuencia normal sin modales adicionales
5. El estado se refleja visualmente (Pendiente/Hecho)

## 🎨 Diseño Visual

- **Color Verde** (`text-green-600`): Antivaho Hecho ✓
- **Color Amarillo** (`text-yellow-600`): Antivaho Pendiente
- **Checkbox verde** (`text-green-600 focus:ring-green-500`): Consistente con tema de "completado"

## 📊 Impacto

### Positivo
✅ Mejor UX para operadores de producción  
✅ Menos interrupciones con modales de confirmación  
✅ Estado visible del antivaho en tiempo real  
✅ Consistente con el resto de checkboxes del sistema  
✅ Compatible con el flujo de antivaho existente  

### Consideraciones
⚠️ Solo visible en etapas de producción (diseño intencional)  
⚠️ Requiere aplicar migración en base de datos existente  
⚠️ El backend maneja la columna dinámicamente (compatibilidad)  

## 🧪 Testing

### Casos de Prueba Sugeridos

1. **Pedido sin antivaho**: Checkbox NO debe aparecer
2. **Pedido con antivaho en PREPARACION**: Checkbox NO debe aparecer
3. **Pedido con antivaho en IMPRESION**: Checkbox debe aparecer
4. **Pedido con antivaho en POST-IMPRESION**: Checkbox debe aparecer
5. **Marcar como "Hecho"**: Debe cambiar a verde con checkmark
6. **Desmarcar "Hecho"**: Debe volver a "Pendiente" amarillo
7. **Guardar cambios**: Debe persistir en BD correctamente

## 📝 Notas de Migración

### Para Desarrollo (Local)
```powershell
.\aplicar-migracion-036.ps1
```

### Para Docker/Producción
La migración se aplicará **automáticamente** en dos lugares:

1. **Script de Entrada Docker** (`docker-entrypoint.sh`):
   - Ejecuta `./run-migrations.sh` al iniciar el contenedor
   - Incluye la migración 036 en orden

2. **Startup Backend** (`index.js`):
   - Verifica si la columna existe
   - Si no existe, la crea automáticamente
   - Esto asegura compatibilidad incluso si el script de migraciones falla

**NO requiere intervención manual en producción**. La migración se aplicará automáticamente al reiniciar/desplegar.

### Orden de Ejecución en Deploy

1. Docker inicia el contenedor
2. `docker-entrypoint.sh` ejecuta `./run-migrations.sh`
3. Se aplican todas las migraciones (000 a 036) en orden
4. Backend inicia y verifica migraciones como respaldo
5. Sistema listo para usar

### Cambios Realizados en Scripts

**`run-migrations.sh`** (Backend):
- ✅ Actualizado con todas las migraciones 000-036
- ✅ Incluye migración 036 en la lista

**`index.js`** (Backend):
- ✅ Agregada lógica automática para aplicar migración 036 al startup
- ✅ Verifica si columna existe antes de crearla
- ✅ Crea índice optimizado automáticamente

## 🔗 Archivos Modificados

1. `components/PedidoModal.tsx` - Agregado checkbox condicional
2. `backend/postgres-client.js` - Soporte para nueva columna en create/update
3. `database/migrations/036-add-antivaho-realizado.sql` - Nueva migración
4. `aplicar-migracion-036.ps1` - Script de aplicación

## 🚀 Próximos Pasos

- [ ] En desarrollo local: ejecutar `.\aplicar-migracion-036.ps1` (opcional, el backend lo hace automáticamente)
- [ ] Reiniciar el servidor backend
- [ ] Probar el checkbox en un pedido con antivaho en producción
- [ ] En producción: Simply redeploy - la migración se aplicará automáticamente

---

**Estado**: ✅ Implementado  
**Versión**: 1.0  
**Requiere Migración BD**: Sí (036)
