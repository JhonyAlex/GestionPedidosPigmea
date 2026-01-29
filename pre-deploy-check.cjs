#!/usr/bin/env node

/**
 * Pre-deployment Checklist
 * Verifica que todo esté listo para producción
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para producción...\n');

const checks = [];
let hasErrors = false;

// Check 1: Archivos esenciales existen
const essentialFiles = [
    'backend/index.js',
    'backend/postgres-client.js',
    'backend/migrations.js',
    'backend/package.json',
    'Dockerfile',
    '.dockerignore',
    'DEPLOYMENT.md'
];

console.log('📁 Verificando archivos esenciales...');
essentialFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    if (exists) {
        console.log(`  ✅ ${file}`);
        checks.push({ name: file, status: 'ok' });
    } else {
        console.log(`  ❌ ${file} - NO ENCONTRADO`);
        checks.push({ name: file, status: 'error' });
        hasErrors = true;
    }
});

// Check 2: Verificar que migrations.js tenga las migraciones
console.log('\n🔄 Verificando sistema de migraciones...');
try {
    const migrationsContent = fs.readFileSync(path.join(__dirname, 'backend', 'migrations.js'), 'utf8');
    const migrationCount = (migrationsContent.match(/this\.migrations\.push/g) || []).length;

    if (migrationCount >= 7) {
        console.log(`  ✅ ${migrationCount} migraciones definidas`);
        checks.push({ name: 'migrations-count', status: 'ok', value: migrationCount });
    } else {
        console.log(`  ⚠️  Solo ${migrationCount} migraciones encontradas (esperadas: 7+)`);
        checks.push({ name: 'migrations-count', status: 'warning', value: migrationCount });
    }
} catch (error) {
    console.log(`  ❌ Error leyendo migrations.js: ${error.message}`);
    hasErrors = true;
}

// Check 3: Verificar Dockerfile
console.log('\n🐳 Verificando Dockerfile...');
try {
    const dockerfileContent = fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf8');

    const hasMultiStage = dockerfileContent.includes('FROM node:18-alpine AS frontend-builder');
    const hasHealthCheck = dockerfileContent.includes('HEALTHCHECK');
    const hasNonRoot = dockerfileContent.includes('USER nodejs');

    if (hasMultiStage) {
        console.log('  ✅ Build multi-stage configurado');
    } else {
        console.log('  ⚠️  Build multi-stage no encontrado');
    }

    if (hasHealthCheck) {
        console.log('  ✅ Health check configurado');
    } else {
        console.log('  ⚠️  Health check no encontrado');
    }

    if (hasNonRoot) {
        console.log('  ✅ Usuario no-root configurado');
    } else {
        console.log('  ❌ Usuario no-root NO configurado (riesgo de seguridad)');
        hasErrors = true;
    }
} catch (error) {
    console.log(`  ❌ Error leyendo Dockerfile: ${error.message}`);
    hasErrors = true;
}

// Check 4: Verificar que index.js use MigrationManager
console.log('\n🔗 Verificando integración de migraciones...');
try {
    const indexContent = fs.readFileSync(path.join(__dirname, 'backend', 'index.js'), 'utf8');

    const hasMigrationImport = indexContent.includes("require('./migrations')");
    const hasMigrationManager = indexContent.includes('new MigrationManager');
    const hasHealthEndpoint = indexContent.includes("app.get('/api/health'");

    if (hasMigrationImport && hasMigrationManager) {
        console.log('  ✅ MigrationManager integrado correctamente');
    } else {
        console.log('  ❌ MigrationManager NO integrado');
        hasErrors = true;
    }

    if (hasHealthEndpoint) {
        console.log('  ✅ Endpoint /api/health configurado');
    } else {
        console.log('  ⚠️  Endpoint /api/health no encontrado');
    }
} catch (error) {
    console.log(`  ❌ Error leyendo index.js: ${error.message}`);
    hasErrors = true;
}

// Check 5: Verificar que postgres-client.js use limpio.pedidos
console.log('\n🗄️  Verificando uso de esquemas...');
try {
    const pgClientContent = fs.readFileSync(path.join(__dirname, 'backend', 'postgres-client.js'), 'utf8');

    // Contar referencias a limpio.pedidos
    const limpioCount = (pgClientContent.match(/limpio\.pedidos/g) || []).length;
    // Contar referencias incorrectas (FROM pedidos sin limpio)
    const publicCount = (pgClientContent.match(/FROM pedidos[^_]/g) || []).length;

    console.log(`  📊 Referencias a 'limpio.pedidos': ${limpioCount}`);
    console.log(`  📊 Referencias a 'FROM pedidos' (sin esquema): ${publicCount}`);

    if (limpioCount > 20 && publicCount === 0) {
        console.log('  ✅ Esquemas configurados correctamente');
    } else if (publicCount > 0) {
        console.log('  ❌ Aún hay referencias sin esquema explícito');
        hasErrors = true;
    } else {
        console.log('  ⚠️  Pocas referencias a limpio.pedidos encontradas');
    }
} catch (error) {
    console.log(`  ❌ Error leyendo postgres-client.js: ${error.message}`);
    hasErrors = true;
}

// Check 6: Verificar .dockerignore
console.log('\n🚫 Verificando .dockerignore...');
try {
    const dockerignoreContent = fs.readFileSync(path.join(__dirname, '.dockerignore'), 'utf8');

    const ignoresNodeModules = dockerignoreContent.includes('node_modules');
    const ignoresEnv = dockerignoreContent.includes('.env');
    const ignoresGit = dockerignoreContent.includes('.git');

    if (ignoresNodeModules && ignoresEnv && ignoresGit) {
        console.log('  ✅ .dockerignore configurado correctamente');
    } else {
        console.log('  ⚠️  .dockerignore podría estar incompleto');
    }
} catch (error) {
    console.log(`  ⚠️  .dockerignore no encontrado (opcional pero recomendado)`);
}

// Resumen final
console.log('\n' + '='.repeat(50));
console.log('📋 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(50));

if (hasErrors) {
    console.log('\n❌ SE ENCONTRARON ERRORES CRÍTICOS');
    console.log('Por favor, corrige los errores antes de desplegar.\n');
    process.exit(1);
} else {
    console.log('\n✅ TODAS LAS VERIFICACIONES PASARON');
    console.log('\n🚀 Tu aplicación está lista para producción!');
    console.log('\nPróximos pasos:');
    console.log('1. git add .');
    console.log('2. git commit -m "feat: sistema production-ready"');
    console.log('3. git push');
    console.log('4. Desplegar en Dokploy\n');
    process.exit(0);
}
