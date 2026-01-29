# 🚀 GUÍA RÁPIDA DE EJECUCIÓN - Reparación de Base de Datos

## ⚡ PASOS INMEDIATOS (Copiar y pegar en PowerShell)

### 📍 Paso 1: Navegar al directorio del proyecto
```powershell
cd "c:\Users\jhony\Desktop\Proyectos Desarrollo\GestionPedidosPigmea"
```

### 📍 Paso 2: Actualizar TODOS los scripts de migración
```powershell
.\database\update-all-migrations.ps1
```

**Resultado esperado:**
```
✅ Archivos actualizados: 20
📦 Backup guardado en: database\migrations_backup_YYYYMMDD_HHMMSS
```

### 📍 Paso 3: Aplicar la migración 036 manualmente
```powershell
Get-Content database\fix-migration-036.sql | docker exec -i 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos
```

**Resultado esperado:**
```
✅ Columna antivaho_realizado agregada a limpio.pedidos
✅ Índice idx_pedidos_antivaho_realizado creado
✅ Migración 036-add-antivaho-realizado registrada como completada
```

### 📍 Paso 4: Verificar estado de la base de datos
```powershell
docker exec 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos -c "SELECT COUNT(*) as total_pedidos FROM limpio.pedidos;"
```

**Resultado esperado:**
```
 total_pedidos 
---------------
            74
```

### 📍 Paso 5: Reiniciar la aplicación
```powershell
docker-compose down
docker-compose up -d
```

### 📍 Paso 6: Verificar logs de la aplicación
```powershell
docker-compose logs -f backend
```

**Buscar en los logs:**
- ✅ `Server running on port 3000` → Aplicación arrancó correctamente
- ❌ `Migration failed` → Hay otra migración fallando

---

## 🔍 COMANDOS DE DIAGNÓSTICO

### Ver estructura de limpio.pedidos:
```powershell
docker exec 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos -c "\d limpio.pedidos"
```

### Ver migraciones ejecutadas:
```powershell
docker exec 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos -c "SELECT name, executed_at FROM migrations ORDER BY executed_at DESC LIMIT 10;"
```

### Verificar columnas críticas:
```powershell
docker exec 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos -c "SELECT column_name FROM information_schema.columns WHERE table_schema = 'limpio' AND table_name = 'pedidos' ORDER BY ordinal_position;"
```

---

## ⚠️ SI ALGO FALLA

### Si el Paso 2 falla (update-all-migrations.ps1):
```powershell
# Verificar política de ejecución de scripts
Get-ExecutionPolicy

# Si es "Restricted", cambiar temporalmente:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Volver a ejecutar el script
.\database\update-all-migrations.ps1
```

### Si el Paso 3 falla (fix-migration-036.sql):
```powershell
# Verificar que Docker está corriendo
docker ps

# Verificar que el contenedor existe
docker ps -a | Select-String "18047ac00bc3"

# Si el contenedor no está corriendo, iniciarlo:
docker start 18047ac00bc3
```

### Si la aplicación no arranca (Paso 6):
```powershell
# Ver logs completos del backend
docker-compose logs backend

# Buscar el error específico
docker-compose logs backend | Select-String "error" -Context 3

# Si hay otra migración fallando, identificarla y aplicar el mismo fix
```

---

## 📊 CHECKLIST DE EJECUCIÓN

- [ ] Paso 1: Navegar al directorio ✓
- [ ] Paso 2: Actualizar scripts de migración ✓
- [ ] Paso 3: Aplicar migración 036 ✓
- [ ] Paso 4: Verificar 74 pedidos ✓
- [ ] Paso 5: Reiniciar aplicación ✓
- [ ] Paso 6: Verificar logs (sin errores) ✓

---

## 🎯 RESULTADO ESPERADO FINAL

✅ Aplicación corriendo en `http://localhost:3000`  
✅ 74 pedidos visibles en la interfaz  
✅ Todas las migraciones ejecutadas correctamente  
✅ No hay errores en los logs  

---

## 📞 SIGUIENTE FASE (Después de que todo funcione)

1. **Revisar código backend** para queries que usen `pedidos` sin schema
2. **Documentar** el cambio de schema en el README
3. **Planificar recuperación** de los ~626-826 pedidos perdidos (si es posible)

---

## 💾 ARCHIVOS CREADOS

- ✅ `database/fix-migration-036.sql` - Script de reparación manual
- ✅ `database/update-all-migrations.ps1` - Script de actualización masiva
- ✅ `database/migration-schema-fix-plan.md` - Plan detallado completo
- ✅ `database/QUICK-START.md` - Esta guía rápida
- ✅ `database/migrations/036-add-antivaho-realizado.sql` - Actualizado
- ✅ `database/migrations/035-add-atencion-observaciones.sql` - Actualizado

---

**¡LISTO PARA EJECUTAR! 🚀**

Copia y pega los comandos del Paso 1 al Paso 6 en PowerShell.
