# 🔧 Plan de Reparación: Migración de Schema public → limpio

## 📊 Situación Actual

### ✅ Lo que funciona:
- PostgreSQL operativo (contenedor `18047ac00bc3`)
- 74 pedidos recuperados en `limpio.pedidos`
- Schema `limpio` configurado correctamente
- `search_path = limpio, public` para `pigmea_user`

### ❌ El problema:
- La tabla `public.pedidos` está **corrupta** (entrada fantasma en catálogo PostgreSQL)
- **35 scripts de migración** referencian `pedidos` sin schema (asumen `public.pedidos`)
- La aplicación no puede arrancar porque las migraciones fallan

---

## 🎯 Estrategia de Solución

### **Fase 1: Reparación Inmediata** ⚡ (EJECUTAR AHORA)

#### 1.1 Aplicar migración 036 manualmente
```bash
# Desde PowerShell en el directorio del proyecto:
Get-Content database\fix-migration-036.sql | docker exec -i 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos
```

**Resultado esperado:**
```
✅ Columna antivaho_realizado agregada a limpio.pedidos
✅ Índice idx_pedidos_antivaho_realizado creado
✅ Migración 036-add-antivaho-realizado registrada como completada
```

#### 1.2 Verificar que la aplicación arranca
```bash
docker-compose up -d
docker-compose logs -f backend
```

---

### **Fase 2: Actualización de Scripts de Migración** 📝

**Scripts ya actualizados:**
- ✅ `036-add-antivaho-realizado.sql` → Usa `limpio.pedidos`
- ✅ `035-add-atencion-observaciones.sql` → Usa `limpio.pedidos`

**Scripts que NECESITAN actualización** (33 archivos):

| Script | Referencias a `pedidos` | Prioridad |
|--------|------------------------|-----------|
| `000-create-pedidos-table.sql` | CREATE TABLE + 4 índices | 🔴 CRÍTICO |
| `001-add-clientes-system.sql` | 2 ALTER TABLE | 🔴 CRÍTICO |
| `006-add-nueva-fecha-entrega.sql` | 1 ALTER TABLE + 1 índice | 🟡 MEDIO |
| `007-add-numero-compra.sql` | 2 ALTER TABLE + 2 índices | 🟡 MEDIO |
| `008-convert-numero-compra-to-array.sql` | 6 ALTER TABLE + 1 índice | 🔴 CRÍTICO |
| `009-add-cliche-info.sql` | 1 ALTER TABLE | 🟡 MEDIO |
| `010-auto-update-cliente-estado.sql` | 2 triggers + 2 índices | 🔴 CRÍTICO |
| `011-add-anonimo.sql` | 1 ALTER TABLE + 1 índice | 🟡 MEDIO |
| `013-add-cliche-dates.sql` | 2 ALTER TABLE + 2 índices | 🟡 MEDIO |
| `014-create-vendedores-table.sql` | - | ✅ OK |
| `015-add-vendedor-fk-to-pedidos.sql` | 2 ALTER TABLE + 1 índice | 🔴 CRÍTICO |
| `016-add-observaciones-material.sql` | 1 ALTER TABLE | 🟡 MEDIO |
| `017-rename-dto-compra.sql` | 2 ALTER TABLE + 3 índices | 🟡 MEDIO |
| `018-add-perforado-fields.sql` | 2 ALTER TABLE | 🟡 MEDIO |
| `019-add-anonimo-post-impresion.sql` | 1 ALTER TABLE | 🟡 MEDIO |
| `022-add-estado-pedido.sql` | 1 ALTER TABLE + 2 índices | 🟡 MEDIO |
| `023-add-performance-indexes.sql` | 9 índices | 🔴 CRÍTICO |
| `024-add-tiempo-produccion-decimal.sql` | 1 ALTER TABLE + 1 índice | 🟡 MEDIO |
| `026-create-produccion-tracking.sql` | 7 ALTER TABLE + 3 índices | 🔴 CRÍTICO |
| `027-create-materiales-table.sql` | CREATE TABLE + 2 índices | 🟢 BAJO |
| `029-add-observaciones-rapidas.sql` | 1 ALTER TABLE | 🟡 MEDIO |
| `030-add-velocidad-posible.sql` | 2 ALTER TABLE + 1 índice | 🟡 MEDIO |

**Total:** 33 scripts con ~80+ referencias a corregir

---

### **Fase 3: Actualización del Código de la Aplicación** 💻

#### 3.1 Archivos backend que necesitan revisión:

```bash
# Buscar todas las queries que usan "FROM pedidos" o "INSERT INTO pedidos"
grep -r "FROM pedidos" backend/
grep -r "INSERT INTO pedidos" backend/
grep -r "UPDATE pedidos" backend/
grep -r "DELETE FROM pedidos" backend/
```

#### 3.2 Opciones de solución:

**Opción A: Mantener search_path** (Recomendado)
- ✅ Menos cambios en el código
- ✅ El `search_path = limpio, public` hace que `pedidos` resuelva a `limpio.pedidos`
- ⚠️ Requiere que TODAS las migraciones usen `limpio.pedidos` explícitamente

**Opción B: Prefijar todas las queries**
- ⚠️ Muchos cambios en el código
- ✅ Más explícito y claro
- ✅ No depende del search_path

---

## 🚀 Pasos Inmediatos (AHORA)

### 1. Ejecutar el script de reparación
```powershell
cd "c:\Users\jhony\Desktop\Proyectos Desarrollo\GestionPedidosPigmea"
Get-Content database\fix-migration-036.sql | docker exec -i 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos
```

### 2. Verificar que la aplicación arranca
```powershell
docker-compose up -d
docker-compose logs -f backend
```

### 3. Si la aplicación arranca correctamente:
- ✅ **Fase 1 completada**
- 📝 Proceder con Fase 2 (actualizar scripts de migración)

### 4. Si la aplicación NO arranca:
- 🔍 Revisar logs para identificar qué migración está fallando
- 📝 Aplicar el mismo fix a esa migración
- 🔁 Repetir hasta que todas las migraciones pasen

---

## 📋 Checklist de Progreso

- [x] Identificar el problema (migración 036 falla)
- [x] Crear script de reparación manual
- [x] Actualizar `036-add-antivaho-realizado.sql`
- [x] Actualizar `035-add-atencion-observaciones.sql`
- [ ] **Ejecutar script de reparación** ← **SIGUIENTE PASO**
- [ ] Verificar que la aplicación arranca
- [ ] Actualizar los 33 scripts restantes
- [ ] Verificar queries en el código backend
- [ ] Documentar el cambio de schema en README

---

## 🔍 Comandos Útiles

### Verificar estado de limpio.pedidos:
```bash
docker exec 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos -c "SELECT COUNT(*) FROM limpio.pedidos;"
```

### Ver columnas de limpio.pedidos:
```bash
docker exec 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos -c "\d limpio.pedidos"
```

### Ver migraciones ejecutadas:
```bash
docker exec 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos -c "SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 10;"
```

### Ver logs de la aplicación:
```bash
docker-compose logs -f backend
```

---

## ⚠️ IMPORTANTE

**NO INTENTES:**
- ❌ Crear o renombrar nada con el nombre "pedidos" en el schema `public`
- ❌ Hacer DROP de `public.pedidos` (ya está corrupto)
- ❌ Ejecutar migraciones sin actualizar las referencias al schema

**SÍ PUEDES:**
- ✅ Trabajar con `limpio.pedidos` sin problemas
- ✅ Crear nuevas tablas en `public` (con nombres diferentes)
- ✅ Usar el `search_path` para que las queries resuelvan a `limpio.pedidos`

---

## 📞 Siguiente Acción

**Ejecuta el comando de la Fase 1 y reporta el resultado.**
