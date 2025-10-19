# 🧪 Guía de Prueba - Sistema de Actualización Automática por Inactividad

## 🎯 Objetivo
Verificar que la aplicación actualice automáticamente los datos cuando el usuario regresa después de un período de inactividad.

---

## 📝 Escenario de Prueba 1: Inactividad Corta (< 5 minutos)

### Pasos:
1. **Abrir la aplicación** en el navegador
2. **Iniciar sesión** con credenciales válidas
3. **Cambiar a otra pestaña** o minimizar el navegador
4. **Esperar 2-3 minutos**
5. **Regresar a la pestaña** de la aplicación

### Resultado Esperado:
- ✅ La aplicación sigue funcionando normalmente
- ✅ No aparece notificación de actualización
- ✅ Los datos se mantienen sincronizados por WebSocket
- ✅ En consola: `👁️ Usuario regresó a la pestaña después de XXXs`

---

## 📝 Escenario de Prueba 2: Inactividad Larga (> 5 minutos)

### Pasos:
1. **Abrir la aplicación** en el navegador
2. **Iniciar sesión** con credenciales válidas
3. **Cambiar a otra pestaña** o minimizar el navegador
4. **Esperar 6+ minutos** ⏰
5. **Regresar a la pestaña** de la aplicación

### Resultado Esperado:
- ✅ Notificación visible: "ℹ️ Actualizando datos - Sincronizando información reciente..."
- ✅ Indicador de carga breve
- ✅ Datos actualizados desde el servidor
- ✅ En consola:
  ```
  👁️ Usuario regresó a la pestaña después de 360s
  🔄 Inactividad detectada, actualizando datos...
  🔄 Refrescando datos después de inactividad...
  ✅ Datos actualizados exitosamente
  ```

---

## 📝 Escenario de Prueba 3: Desconexión y Retorno

### Pasos:
1. **Abrir la aplicación** en el navegador
2. **Deshabilitar el backend** (detener el servidor)
3. **Esperar** a que la conexión WebSocket se pierda
4. **Cambiar a otra pestaña** por 6+ minutos
5. **Reiniciar el backend** mientras está inactivo
6. **Regresar a la pestaña** de la aplicación

### Resultado Esperado:
- ✅ Intento de reconexión WebSocket automático
- ✅ Notificación de actualización de datos
- ✅ Conexión restablecida
- ✅ Datos sincronizados con el servidor

---

## 📝 Escenario de Prueba 4: Cambios Durante Inactividad

### Preparación:
- Tener **dos navegadores/pestañas** abiertos con diferentes usuarios

### Pasos:
1. **Usuario A:** Abrir la aplicación
2. **Usuario A:** Cambiar a otra pestaña por 6+ minutos
3. **Usuario B:** Hacer cambios en pedidos (crear, editar, eliminar)
4. **Usuario A:** Regresar a la pestaña

### Resultado Esperado:
- ✅ Usuario A ve los cambios de Usuario B inmediatamente
- ✅ Notificación de actualización
- ✅ Datos sincronizados correctamente

---

## 🔍 Verificación en Consola del Navegador

### Abrir DevTools:
- **Chrome/Edge:** F12
- **Firefox:** F12
- **Safari:** Cmd+Option+I (Mac)

### Filtrar logs:
```javascript
// En la pestaña Console, buscar:
👁️  // Eventos de visibilidad
🔄  // Eventos de actualización
✅  // Confirmaciones
```

---

## 🧪 Prueba Manual del Umbral (Desarrollo)

### Cambiar el umbral temporalmente:

**Archivo:** `services/websocket.ts`

```typescript
// ANTES (5 minutos)
private readonly INACTIVITY_THRESHOLD = 5 * 60 * 1000;

// PARA PRUEBAS (30 segundos)
private readonly INACTIVITY_THRESHOLD = 30 * 1000;
```

### Pasos:
1. Cambiar el umbral a 30 segundos
2. Guardar y recargar la aplicación
3. Salir de la pestaña por 35 segundos
4. Regresar y verificar actualización
5. **¡IMPORTANTE!** Revertir el cambio después de las pruebas

---

## 📊 Checklist de Verificación

### Funcionalidad Básica:
- [ ] Detecta cuando el usuario sale de la pestaña
- [ ] Registra el tiempo de inactividad
- [ ] Detecta cuando el usuario regresa
- [ ] Calcula correctamente el tiempo transcurrido

### Actualización de Datos:
- [ ] No actualiza si la inactividad es < 5 minutos
- [ ] Actualiza automáticamente si la inactividad es > 5 minutos
- [ ] Muestra notificación de actualización
- [ ] Carga datos del servidor correctamente

### Reconexión WebSocket:
- [ ] Reintenta conexión si está desconectado
- [ ] Mantiene conexión si está conectado
- [ ] Sincroniza cambios en tiempo real

### Experiencia de Usuario:
- [ ] No interrumpe el flujo de trabajo
- [ ] Notificaciones claras y no intrusivas
- [ ] Indicador de carga apropiado
- [ ] Sin errores en consola

---

## 🐛 Problemas Comunes

### Problema: "No se detecta el retorno"
**Solución:**
- Verificar que no haya extensiones bloqueando eventos
- Probar en modo incógnito
- Revisar permisos del navegador

### Problema: "Se actualiza constantemente"
**Solución:**
- Verificar que el umbral sea 5 minutos (no 5 segundos)
- Revisar que no haya múltiples instancias del servicio

### Problema: "Error al cargar datos"
**Solución:**
- Verificar que el backend esté funcionando
- Revisar la conexión de red
- Verificar credenciales de autenticación

---

## 📈 Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Detección de inactividad | 100% |
| Actualización automática | 100% |
| Tiempo de actualización | < 2 segundos |
| Errores en actualización | 0% |
| Reconexión exitosa | > 95% |

---

## 🎓 Notas para Desarrolladores

### Logs importantes:
```javascript
// Salida de pestaña
console.log('👁️ Usuario salió de la pestaña');

// Regreso a pestaña
console.log(`👁️ Usuario regresó a la pestaña después de ${tiempo}s`);

// Inicio de actualización
console.log('🔄 Inactividad detectada, actualizando datos...');
console.log('🔄 Refrescando datos después de inactividad...');

// Actualización exitosa
console.log('✅ Datos actualizados exitosamente');
```

### Eventos del navegador utilizados:
- `document.visibilitychange` - Principal
- `window.focus` - Respaldo
- `window.blur` - Respaldo
- `window.pageshow` - Cache navigation

---

## ✅ Resultado Final Esperado

Después de completar todas las pruebas:

✅ Sistema detecta correctamente inactividad  
✅ Actualización automática funciona perfectamente  
✅ WebSocket se reconecta cuando es necesario  
✅ Datos siempre están sincronizados  
✅ Experiencia de usuario fluida  
✅ Sin errores en consola  
✅ Notificaciones apropiadas  

---

## 📅 Última Actualización
**Octubre 20, 2025**

## 👨‍💻 Tester
_[Tu nombre aquí]_

## ✍️ Notas Adicionales
_[Agregar observaciones o problemas encontrados]_
