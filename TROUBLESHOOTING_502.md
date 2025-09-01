# 🆘 Guía de Troubleshooting - Error 502 Bad Gateway

## 🔍 **Diagnóstico del Error 502**

El error 502 Bad Gateway indica que el servidor no se está iniciando correctamente. Las causas más comunes son:

### **1. ❌ Variables de Entorno Faltantes**
El servidor no puede conectar a PostgreSQL porque faltan variables de entorno.

**✅ Solución en Dokploy:**
1. Ve a tu aplicación → **"Environment Variables"**
2. Agrega TODAS estas variables:
```bash
DB_HOST=gestion-pedidos-db
DB_PORT=5432
DB_NAME=gestion_pedidos
DB_USER=pigmea_user
DB_PASSWORD=tu_contraseña_real
```

### **2. ❌ Base de Datos PostgreSQL No Está Corriendo**
La base de datos PostgreSQL puede no estar iniciada.

**✅ Verificar en Dokploy:**
1. Ve a tu base de datos PostgreSQL
2. Verifica que esté en estado **"Running"**
3. Si no está corriendo, inicia la base de datos

### **3. ❌ Red Docker Incorrecta**
La aplicación no puede conectar a la base de datos por problemas de red.

**✅ Verificar en Dokploy:**
1. Aplicación y base de datos deben estar en el **mismo proyecto**
2. Dokploy maneja la red automáticamente si están en el mismo proyecto

### **4. ❌ Credenciales Incorrectas**
Usuario o contraseña incorrectos.

**✅ Verificar:**
1. Ve a la configuración de tu PostgreSQL en Dokploy
2. Verifica usuario y contraseña
3. Asegúrate de que las variables de entorno coincidan

## 🔧 **Pasos de Solución**

### **Paso 1: Verificar Logs**
1. En Dokploy, ve a tu aplicación → **"Logs"**
2. Busca mensajes como:
```
❌ Variables de entorno faltantes para PostgreSQL
❌ Error conectando a PostgreSQL
🔍 Variables de entorno disponibles
```

### **Paso 2: Configurar Variables**
En **Environment Variables**, agrega:
```bash
DB_HOST=nombre-de-tu-postgresql    # ⚠️ Cambia por el nombre real
DB_PORT=5432
DB_NAME=nombre-de-tu-database      # ⚠️ Cambia por el nombre real
DB_USER=tu-usuario                 # ⚠️ Cambia por tu usuario real
DB_PASSWORD=tu-contraseña          # ⚠️ Cambia por tu contraseña real
```

### **Paso 3: Verificar PostgreSQL**
1. Ve a tu base de datos PostgreSQL
2. Asegúrate de que esté **"Running"**
3. Verifica la configuración (usuario, contraseña, database)

### **Paso 4: Re-Deploy**
1. Después de configurar las variables
2. Haz **"Deploy"** de nuevo
3. Verifica los logs

## 🕵️ **Cómo Leer los Logs**

Busca estos mensajes en los logs:

### **✅ Logs Exitosos:**
```
🔄 Inicializando conexión PostgreSQL...
🐘 PostgreSQL conectado exitosamente
✅ PostgreSQL inicializado correctamente
🚀 Servidor HTTP escuchando en el puerto 8080
```

### **❌ Logs de Error:**
```
❌ Variables de entorno faltantes para PostgreSQL
❌ Error conectando a PostgreSQL: connect ECONNREFUSED
❌ Error conectando a PostgreSQL: password authentication failed
```

## 🎯 **Soluciones Específicas por Error**

### **Error: "connect ECONNREFUSED"**
- **Causa**: La base de datos no está corriendo o el host es incorrecto
- **Solución**: Verificar que PostgreSQL esté corriendo y el `DB_HOST` sea correcto

### **Error: "password authentication failed"**
- **Causa**: Usuario o contraseña incorrectos
- **Solución**: Verificar `DB_USER` y `DB_PASSWORD`

### **Error: "database does not exist"**
- **Causa**: El nombre de la base de datos es incorrecto
- **Solución**: Verificar `DB_NAME`

### **Error: "Variables de entorno faltantes"**
- **Causa**: No están configuradas todas las variables
- **Solución**: Agregar todas las variables en Dokploy

## 🔄 **Proceso de Verificación Completo**

1. **PostgreSQL corriendo** ✅
2. **Variables configuradas** ✅  
3. **Misma red/proyecto** ✅
4. **Deploy exitoso** ✅
5. **Health check OK** ✅

## 📞 **Si Nada Funciona**

1. **Toma screenshot** de:
   - Variables de entorno configuradas
   - Estado de la base de datos PostgreSQL
   - Logs de la aplicación
   
2. **Información necesaria**:
   - Nombre exacto de tu base de datos en Dokploy
   - Usuario y contraseña configurados
   - Logs completos del deploy

## 🎉 **Test Final**

Cuando todo funcione, deberías poder:
1. Acceder a `https://tu-app.com/health`
2. Ver: `"status": "healthy"` y `"database": "PostgreSQL"`
3. Usar la aplicación normalmente

---

**💡 Tip:** Los errores 502 en despliegues nuevos son normales y se solucionan configurando correctamente las variables de entorno.
