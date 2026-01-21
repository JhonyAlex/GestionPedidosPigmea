# 🔐 Configuración de OpenRouter en Dokploy

## ✅ Cambios Implementados

Se protegió el API key de OpenRouter moviéndolo del frontend al backend:

- ✅ **Backend**: Nuevo endpoint `/api/analysis/generate` que maneja las llamadas a OpenRouter
- ✅ **Frontend**: Modificado para llamar al backend en lugar de OpenRouter directamente
- ✅ **Seguridad**: El API key ahora está 100% protegido en el servidor

---

## 📋 Instrucciones para Dokploy

### 1️⃣ Acceder a tu Proyecto en Dokploy

1. Inicia sesión en tu panel de Dokploy
2. Selecciona el proyecto `GestionPedidosPigmea`
3. Ve a la sección **Environment Variables** o **Configuración**

---

### 2️⃣ Agregar Variable de Entorno

Agrega la siguiente variable de entorno:

**Nombre de la variable:**
```
OPENROUTER_API_KEY
```

**Valor:**
```
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
```

**Scope/Ámbito:**
- ✅ Solo para el **servicio del backend** (Node.js)
- ❌ NO es necesaria en el frontend

---

### 3️⃣ Reiniciar el Servicio

Después de agregar la variable de entorno:

1. **Guarda** los cambios
2. **Reinicia** el servicio del backend
3. **Verifica** que el backend se haya iniciado correctamente

---

## 🧪 Cómo Probar que Funciona

1. Abre tu aplicación en el navegador
2. Ve a **Centro de Planificación**
3. Haz clic en el botón **"Análisis IA"**
4. Deberías ver el análisis generado sin errores

Si ves un error:
- Verifica que la variable `OPENROUTER_API_KEY` esté configurada
- Revisa los logs del backend en Dokploy
- Asegúrate de haber reiniciado el servicio después de agregar la variable

---

## 🔍 Verificación en Logs

En los logs del backend, NO deberías ver errores como:
```
OPENROUTER_API_KEY no está configurada en las variables de entorno
```

Si ves ese error, la variable no está configurada correctamente en Dokploy.

---

## 📸 Captura de Pantalla de Referencia

En Dokploy, la configuración debería verse así:

```
┌─────────────────────────────────────────────────┐
│ Environment Variables                           │
├─────────────────────────────────────────────────┤
│ Name                  Value                     │
├─────────────────────────────────────────────────┤
│ OPENROUTER_API_KEY    sk-or-v1-eaa67...102de   │
│ DATABASE_URL          postgresql://...          │
│ NODE_ENV              production                │
│ ...                   ...                       │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Ventajas de Esta Implementación

✅ **Seguridad Total**: El API key NUNCA se expone al frontend
✅ **Control de Acceso**: Solo usuarios autenticados pueden generar análisis
✅ **Cache Inteligente**: Los análisis se guardan en IndexedDB (1 hora)
✅ **Bajo Costo**: Solo se llama a la API cuando es necesario
✅ **Trazabilidad**: Todos los logs de OpenRouter están en el servidor

---

## ❓ Preguntas Frecuentes

### ¿Y si no uso Dokploy?

Si usas otra plataforma (Heroku, Vercel, Railway, etc.), solo necesitas agregar la variable de entorno `OPENROUTER_API_KEY` en la configuración de tu servicio.

### ¿Puedo cambiar el modelo de IA?

Sí, edita el archivo `backend/index.js` y cambia:
```javascript
model: 'google/gemini-flash-1.5'
```

Por otro modelo disponible en OpenRouter.

### ¿Cómo sé cuánto estoy gastando?

Ingresa a tu cuenta de OpenRouter.ai y revisa el dashboard de uso y costos.

---

## 🚀 ¡Listo!

Una vez configurada la variable de entorno en Dokploy, el análisis con IA funcionará de forma segura y eficiente.
