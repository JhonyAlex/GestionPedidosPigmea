/**
 * Sistema de Migraciones Automáticas para Production
 * 
 * Este módulo maneja todas las migraciones de base de datos de forma segura y automática.
 * Se ejecuta al iniciar el servidor y garantiza que la BD esté actualizada.
 */

class MigrationManager {
    constructor(dbClient) {
        this.dbClient = dbClient;
        this.migrations = [];
        this.initializeMigrations();
    }

    /**
     * Define todas las migraciones en orden cronológico
     */
    initializeMigrations() {
        // Migración 000: Schema inicial y tabla pedidos base
        this.migrations.push({
            id: '000-initial-schema',
            name: 'Crear esquema limpio y tabla pedidos base',
            sql: `
                -- Crear esquema limpio si no existe
                CREATE SCHEMA IF NOT EXISTS limpio;

                -- Crear tabla pedidos si no existe
                CREATE TABLE IF NOT EXISTS limpio.pedidos (
                    id VARCHAR(255) PRIMARY KEY,
                    cliente VARCHAR(255) NOT NULL,
                    descripcion TEXT,
                    fecha_entrega TIMESTAMP,
                    estado VARCHAR(50) DEFAULT 'pendiente',
                    etapa_actual VARCHAR(50) DEFAULT 'ingreso',
                    prioridad VARCHAR(20) DEFAULT 'normal',
                    secuencia_pedido SERIAL,
                    data JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Crear índices base
                CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON limpio.pedidos(cliente);
                CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON limpio.pedidos(estado);
            `
        });

        // Migración 001: Nueva fecha de entrega
        this.migrations.push({
            id: '001-nueva-fecha-entrega',
            name: 'Agregar columna nueva_fecha_entrega',
            sql: `
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedidos' 
                        AND column_name = 'nueva_fecha_entrega'
                    ) THEN
                        ALTER TABLE limpio.pedidos ADD COLUMN nueva_fecha_entrega TIMESTAMP;
                        CREATE INDEX IF NOT EXISTS idx_pedidos_nueva_fecha_entrega ON limpio.pedidos(nueva_fecha_entrega);
                        RAISE NOTICE 'Columna nueva_fecha_entrega agregada';
                    ELSE
                        RAISE NOTICE 'Columna nueva_fecha_entrega ya existe';
                    END IF;
                END $$;
            `
        });

        // Migración 002: Números de compra
        this.migrations.push({
            id: '002-numeros-compra',
            name: 'Agregar columna numeros_compra',
            sql: `
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedidos' 
                        AND column_name = 'numeros_compra'
                    ) THEN
                        ALTER TABLE limpio.pedidos ADD COLUMN numeros_compra JSONB DEFAULT '[]'::jsonb;
                        CREATE INDEX IF NOT EXISTS idx_pedidos_numeros_compra ON limpio.pedidos USING gin(numeros_compra);
                        RAISE NOTICE 'Columna numeros_compra agregada';
                    ELSE
                        RAISE NOTICE 'Columna numeros_compra ya existe';
                    END IF;
                END $$;
            `
        });

        // Migración 003: Vendedor
        this.migrations.push({
            id: '003-vendedor',
            name: 'Agregar columna vendedor',
            sql: `
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedidos' 
                        AND column_name = 'vendedor'
                    ) THEN
                        ALTER TABLE limpio.pedidos ADD COLUMN vendedor VARCHAR(255);
                        CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor ON limpio.pedidos(vendedor);
                        RAISE NOTICE 'Columna vendedor agregada';
                    ELSE
                        RAISE NOTICE 'Columna vendedor ya existe';
                    END IF;
                END $$;
            `
        });

        // Migración 004: Anónimo
        this.migrations.push({
            id: '004-anonimo',
            name: 'Agregar columna anonimo',
            sql: `
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedidos' 
                        AND column_name = 'anonimo'
                    ) THEN
                        ALTER TABLE limpio.pedidos ADD COLUMN anonimo BOOLEAN DEFAULT false;
                        CREATE INDEX IF NOT EXISTS idx_pedidos_anonimo ON limpio.pedidos(anonimo);
                        COMMENT ON COLUMN limpio.pedidos.anonimo IS 'Indica si el pedido es anónimo';
                        RAISE NOTICE 'Columna anonimo agregada';
                    ELSE
                        RAISE NOTICE 'Columna anonimo ya existe';
                    END IF;
                END $$;
            `
        });

        // Migración 005: Fechas de cliché
        this.migrations.push({
            id: '005-fechas-cliche',
            name: 'Agregar columnas compra_cliche y recepcion_cliche',
            sql: `
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedidos' 
                        AND column_name = 'compra_cliche'
                    ) THEN
                        ALTER TABLE limpio.pedidos ADD COLUMN compra_cliche DATE;
                        CREATE INDEX IF NOT EXISTS idx_pedidos_compra_cliche ON limpio.pedidos(compra_cliche);
                        COMMENT ON COLUMN limpio.pedidos.compra_cliche IS 'Fecha de Compra Cliché';
                        RAISE NOTICE 'Columna compra_cliche agregada';
                    ELSE
                        RAISE NOTICE 'Columna compra_cliche ya existe';
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedidos' 
                        AND column_name = 'recepcion_cliche'
                    ) THEN
                        ALTER TABLE limpio.pedidos ADD COLUMN recepcion_cliche DATE;
                        CREATE INDEX IF NOT EXISTS idx_pedidos_recepcion_cliche ON limpio.pedidos(recepcion_cliche);
                        COMMENT ON COLUMN limpio.pedidos.recepcion_cliche IS 'Fecha de Recepción del Cliché';
                        RAISE NOTICE 'Columna recepcion_cliche agregada';
                    ELSE
                        RAISE NOTICE 'Columna recepcion_cliche ya existe';
                    END IF;
                END $$;
            `
        });

        // Migración 006: Horas confirmadas
        this.migrations.push({
            id: '006-horas-confirmadas',
            name: 'Agregar columna horas_confirmadas',
            sql: `
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedidos' 
                        AND column_name = 'horas_confirmadas'
                    ) THEN
                        ALTER TABLE limpio.pedidos ADD COLUMN horas_confirmadas BOOLEAN DEFAULT false;
                        COMMENT ON COLUMN limpio.pedidos.horas_confirmadas IS 'Indica si las horas de cliché han sido confirmadas';
                        RAISE NOTICE 'Columna horas_confirmadas agregada';
                    ELSE
                        RAISE NOTICE 'Columna horas_confirmadas ya existe';
                    END IF;
                END $$;
            `
        });

        // Migración 007: Antivaho realizado
        this.migrations.push({
            id: '007-antivaho-realizado',
            name: 'Agregar columna antivaho_realizado',
            sql: `
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedidos' 
                        AND column_name = 'antivaho_realizado'
                    ) THEN
                        ALTER TABLE limpio.pedidos ADD COLUMN antivaho_realizado BOOLEAN DEFAULT false;
                        CREATE INDEX IF NOT EXISTS idx_pedidos_antivaho_realizado ON limpio.pedidos(antivaho_realizado);
                        COMMENT ON COLUMN limpio.pedidos.antivaho_realizado IS 'Indica si el tratamiento antivaho ha sido realizado';
                        RAISE NOTICE 'Columna antivaho_realizado agregada';
                    ELSE
                        RAISE NOTICE 'Columna antivaho_realizado ya existe';
                    END IF;
                END $$;
            `
        });

        // Migración 008: Sistema de menciones en comentarios
        this.migrations.push({
            id: '008-menciones-comentarios',
            name: 'Agregar sistema de menciones en comentarios',
            sql: `
                DO $$ 
                BEGIN
                    -- Agregar columna mentioned_users si no existe
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedido_comments' 
                        AND column_name = 'mentioned_users'
                    ) THEN
                        ALTER TABLE limpio.pedido_comments 
                        ADD COLUMN mentioned_users JSONB DEFAULT '[]'::jsonb;
                        
                        COMMENT ON COLUMN limpio.pedido_comments.mentioned_users IS 
                        'Array JSONB de usuarios mencionados. Formato: [{"id": "uuid", "username": "nombre"}]';
                        
                        -- Crear índice GIN para búsqueda eficiente
                        CREATE INDEX IF NOT EXISTS idx_pedido_comments_mentioned_users_gin 
                        ON limpio.pedido_comments USING gin(mentioned_users);
                        
                        RAISE NOTICE 'Columna mentioned_users agregada a pedido_comments';
                    ELSE
                        RAISE NOTICE 'Columna mentioned_users ya existe en pedido_comments';
                    END IF;
                END $$;
            `
        });

        // Migración 009: Tablas faltantes (Clientes y Notificaciones)
        this.migrations.push({
            id: '009-tablas-faltantes-v2',
            name: 'Crear tablas clientes, notificaciones y corregir pedidos',
            sql: `
                -- 1. Crear tabla Clientes si no existe
                CREATE TABLE IF NOT EXISTS limpio.clientes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    nombre VARCHAR(255) NOT NULL,
                    razon_social VARCHAR(255),
                    cif VARCHAR(50),
                    direccion_fiscal TEXT,
                    persona_contacto VARCHAR(255),
                    telefono VARCHAR(50),
                    email VARCHAR(255),
                    estado VARCHAR(50) DEFAULT 'activo',
                    notas TEXT, 
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- 2. Corregir tabla Pedidos (agregar cliente_id si no existe)
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'limpio'
                        AND table_name = 'pedidos' 
                        AND column_name = 'cliente_id'
                    ) THEN
                        ALTER TABLE limpio.pedidos ADD COLUMN cliente_id UUID;
                        CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON limpio.pedidos(cliente_id);
                        RAISE NOTICE 'Columna cliente_id agregada a pedidos';
                    END IF;
                END $$;

                -- 3. Crear tabla Notificaciones (public)
                CREATE TABLE IF NOT EXISTS notifications (
                    id VARCHAR(255) PRIMARY KEY,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    read BOOLEAN DEFAULT false,
                    pedido_id VARCHAR(255),
                    user_id UUID,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            `
        });

        // Migración 010: Tabla de instrucciones de análisis
        this.migrations.push({
            id: '010-tabla-instrucciones-analisis',
            name: 'Crear tabla analysis_instructions',
            sql: `
                CREATE TABLE IF NOT EXISTS analysis_instructions (
                    id SERIAL PRIMARY KEY,
                    instructions TEXT,
                    updated_by UUID,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `
        });
    }

    /**
     * Crea la tabla de control de migraciones si no existe
     */
    async ensureMigrationsTable() {
        // Asegurar que el esquema 'limpio' existe antes de crear la tabla de migraciones
        await this.dbClient.pool.query('CREATE SCHEMA IF NOT EXISTS limpio;');

        const sql = `
            CREATE TABLE IF NOT EXISTS limpio.migrations (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN DEFAULT true
            );
        `;

        try {
            await this.dbClient.pool.query(sql);
            console.log('✅ Tabla de migraciones verificada');
        } catch (error) {
            console.error('❌ Error creando tabla de migraciones:', error.message);
            throw error;
        }
    }

    /**
     * Verifica si una migración ya fue aplicada
     */
    async isMigrationApplied(migrationId) {
        try {
            const result = await this.dbClient.pool.query(
                'SELECT id FROM limpio.migrations WHERE id = $1 AND success = true',
                [migrationId]
            );
            return result.rows.length > 0;
        } catch (error) {
            // Si la tabla no existe aún, ninguna migración está aplicada
            return false;
        }
    }

    /**
     * Registra una migración como aplicada
     */
    async recordMigration(migrationId, name, success = true) {
        try {
            await this.dbClient.pool.query(
                `INSERT INTO limpio.migrations (id, name, success) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (id) DO UPDATE SET applied_at = CURRENT_TIMESTAMP, success = $3`,
                [migrationId, name, success]
            );
        } catch (error) {
            console.error(`❌ Error registrando migración ${migrationId}:`, error.message);
        }
    }

    /**
     * Ejecuta todas las migraciones pendientes
     */
    async runPendingMigrations() {
        if (!this.dbClient.isInitialized) {
            console.error('❌ Base de datos no inicializada. No se pueden ejecutar migraciones.');
            return { success: false, error: 'Database not initialized' };
        }

        console.log('🔄 Verificando migraciones pendientes...');

        try {
            // Asegurar que existe la tabla de control
            await this.ensureMigrationsTable();

            const results = [];
            let pendingCount = 0;

            for (const migration of this.migrations) {
                const isApplied = await this.isMigrationApplied(migration.id);

                if (isApplied) {
                    console.log(`⏭️  Migración ${migration.id} ya aplicada`);
                    continue;
                }

                pendingCount++;
                console.log(`🔄 Aplicando migración: ${migration.name}...`);

                try {
                    await this.dbClient.pool.query(migration.sql);
                    await this.recordMigration(migration.id, migration.name, true);
                    console.log(`✅ Migración ${migration.id} aplicada exitosamente`);
                    results.push({ id: migration.id, success: true });
                } catch (error) {
                    console.error(`❌ Error en migración ${migration.id}:`, error.message);
                    await this.recordMigration(migration.id, migration.name, false);
                    results.push({ id: migration.id, success: false, error: error.message });

                    // No detener el proceso, continuar con las siguientes migraciones
                }
            }

            if (pendingCount === 0) {
                console.log('✅ Base de datos actualizada. No hay migraciones pendientes.');
            } else {
                console.log(`✅ Proceso de migraciones completado. ${pendingCount} migraciones procesadas.`);
            }

            return { success: true, results, pendingCount };

        } catch (error) {
            console.error('❌ Error ejecutando migraciones:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = MigrationManager;
