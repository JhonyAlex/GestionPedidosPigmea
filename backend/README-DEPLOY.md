# 🚀 DESPLIEGUE EN PRODUCCIÓN - Gestión Pedidos Pigmea

## 📋 Requisitos Previos

- **Node.js 18+** instalado
- **npm** instalado
- Acceso a la base de datos PostgreSQL
- Puerto 3001 disponible

## 🗄️ Configuración de Base de Datos

El sistema está configurado para conectarse a:
- **Host:** control-produccin-pigmea-gestionpedidosdb-vcfcjc
- **Usuario:** pigmea_user
- **Contraseña:** Pigmea_2025_DbSecure42
- **Base de datos:** gestion_pedidos
- **Puerto:** 5432

## 🚀 Pasos para Desplegar

### 1. Copiar archivos al servidor
```bash
# Subir todos los archivos del directorio backend/ a tu servidor
```

### 2. Ejecutar script de despliegue
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Iniciar el servidor
```bash
npm start
```

### 4. Verificar funcionamiento
```bash
curl http://localhost:3001/health
```

## 🔧 Configuración Manual (Alternativa)

Si prefieres configurar manualmente:

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.production .env
# Editar .env si es necesario
```

### 3. Iniciar servidor
```bash
npm start
```

## 🌐 URLs de Acceso

- **Frontend:** http://tu-servidor:3001
- **API:** http://tu-servidor:3001/api
- **Health Check:** http://tu-servidor:3001/health

## 🔐 Credenciales de Acceso

### Usuarios por defecto:
- **Administrador:** admin / admin123
- **Supervisor:** supervisor / super123
- **Operador:** operador / oper123

*En producción, estos usuarios serán cargados desde la base de datos PostgreSQL.*

## 📊 Funcionalidades Incluidas

✅ Sistema de autenticación con PostgreSQL
✅ Gestión completa de pedidos
✅ Comunicación en tiempo real (WebSockets)
✅ Auditoría y historial de cambios
✅ Sistema de secuencias y reordenamiento
✅ Duplicación de pedidos con feedback visual
✅ Interfaz responsive con modo oscuro
✅ Rate limiting para seguridad
✅ CORS configurado para producción

## 🔍 Verificación de Estado

### Health Check
```bash
curl http://localhost:3001/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-03T...",
  "database": "PostgreSQL",
  "websocketConnections": 0,
  "connectedUsers": 0,
  "totalPedidos": 18,
  "totalUsuarios": 4,
  "pedidosPorEtapa": [...]
}
```

### Test de autenticación
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🚨 Solución de Problemas

### Error de conexión a base de datos
- Verificar que el host de PostgreSQL sea accesible
- Comprobar credenciales en archivo .env
- Verificar que el puerto 5432 esté abierto

### Puerto en uso
```bash
lsof -i :3001
kill <PID>
```

### Verificar logs
```bash
npm start > server.log 2>&1 &
tail -f server.log
```

## 📞 Soporte

Si encuentras problemas durante el despliegue, verifica:
1. Logs del servidor
2. Conectividad a la base de datos
3. Configuración de variables de entorno
4. Permisos de archivos y directorios
