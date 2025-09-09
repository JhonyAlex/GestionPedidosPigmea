/**
 * Script para sincronizar las definiciones de permisos entre frontend y backend
 * 
 * Este script genera una lista completa de todos los permisos definidos
 * en el frontend (constants/permissions.ts) y los guarda en un archivo JSON
 * que puede ser leído por el backend para asegurar consistencia.
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo de constantes de permisos del frontend
const permissionsFile = path.join(__dirname, '..', 'constants', 'permissions.ts');
// Ruta donde guardar el archivo JSON
const outputFile = path.join(__dirname, '..', 'backend', 'permissions-map.json');

// Expresión regular para extraer IDs de permisos del archivo
const permissionIdRegex = /id:\s*['"]([^'"]+)['"]/g;

try {
  // Leer el archivo de permisos
  const fileContent = fs.readFileSync(permissionsFile, 'utf8');
  
  // Extraer todos los IDs de permisos únicos
  const permissionIds = new Set();
  let match;
  
  while ((match = permissionIdRegex.exec(fileContent)) !== null) {
    permissionIds.add(match[1]);
  }
  
  // Convertir a un array y ordenar
  const uniquePermissionIds = Array.from(permissionIds).sort();
  
  // Crear el mapa de permisos con descripciones
  const permissionsMap = uniquePermissionIds.reduce((map, id) => {
    const [category, action] = id.split('.');
    map[id] = {
      id,
      category,
      action,
      description: `Permite ${action} ${category}`
    };
    return map;
  }, {});
  
  // Guardar como JSON
  fs.writeFileSync(
    outputFile, 
    JSON.stringify(permissionsMap, null, 2),
    'utf8'
  );
  
  console.log(`✅ Se han sincronizado ${uniquePermissionIds.length} permisos en ${outputFile}`);
  console.log('IDs de permisos encontrados:');
  uniquePermissionIds.forEach(id => console.log(`- ${id}`));
  
} catch (error) {
  console.error('❌ Error al sincronizar permisos:', error);
}
