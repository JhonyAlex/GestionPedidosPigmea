const { Pool } = require('pg');

class PostgreSQLClient {
    constructor() {
        this.pool = null;
        this.isInitialized = false;
        
        // Priorizar DATABASE_URL que es el estándar en producción
        if (process.env.DATABASE_URL) {
            this.config = {
                connectionString: process.env.DATABASE_URL,
                ssl: false, // Deshabilitar SSL para conexiones internas de Docker
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };
        } else if (process.env.DB_HOST || process.env.POSTGRES_HOST) {
            // Configuración de conexión individual
            this.config = {
                host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT) || 5432,
                database: process.env.POSTGRES_DB || process.env.DB_NAME || 'gestion_pedidos',
                user: process.env.POSTGRES_USER || process.env.DB_USER || 'pigmea_user',
                password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
                ssl: false, // Deshabilitar SSL para conexiones internas de Docker
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };
        } else {
            // Fallback a localhost para desarrollo
            this.config = {
                host: 'localhost',
                port: 5432,
                database: 'gestion_pedidos',
                user: 'pigmea_user',
                password: '',
                ssl: false,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };
        }
    }

    // === MÉTODOS PARA ADMIN USERS ===

    async getAdminUserByUsername(username) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM admin_users WHERE username = $1', [username]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async getAdminUserById(id) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM admin_users WHERE id = $1', [id]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async getAllAdminUsers() {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM admin_users ORDER BY username');
            return result.rows;
        } finally {
            client.release();
        }
    }

    async createAdminUser(userData) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const { username, email, firstName, lastName, passwordHash, role, isActive } = userData;
            const query = `
                INSERT INTO admin_users (username, email, first_name, last_name, password_hash, role, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;
            const values = [username, email, firstName, lastName, passwordHash, role, isActive];
            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async updateAdminUser(id, updateData) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const setParts = [];
            const values = [];
            let valueIndex = 1;

            const validKeys = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active'];
            for (const key of validKeys) {
                if (updateData[key] !== undefined) {
                    setParts.push(`${key} = $${valueIndex++}`);
                    values.push(updateData[key]);
                }
            }

            if (setParts.length === 0) {
                return this.getAdminUserById(id);
            }

            values.push(id);
            const query = `
                UPDATE admin_users
                SET ${setParts.join(', ')}
                WHERE id = $${valueIndex}
                RETURNING *;
            `;

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async deleteAdminUser(id) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM admin_users WHERE id = $1', [id]);
        } finally {
            client.release();
        }
    }

    async updateUserLastLogin(id, ipAddress, userAgent) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE admin_users
                SET last_login = CURRENT_TIMESTAMP, ip_address = $2, user_agent = $3
                WHERE id = $1;
            `;
            await client.query(query, [id, ipAddress, userAgent]);
        } finally {
            client.release();
        }
    }

    async updateUserPassword(id, passwordHash) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE admin_users
                SET password_hash = $2
                WHERE id = $1;
            `;
            await client.query(query, [id, passwordHash]);
        } finally {
            client.release();
        }
    }

    async init() {
        try {
            this.pool = new Pool(this.config);
            
            // Probar la conexión con timeout
            const client = await Promise.race([
                this.pool.connect(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout de conexión (5s)')), 5000)
                )
            ]);
            
            console.log('✅ PostgreSQL conectado correctamente');
            client.release();
            
            // Crear las tablas si no existen
            await this.createTables();
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Error conectando a PostgreSQL:', error.message);
            
            // Si el error es específicamente de clave foránea o columnas faltantes, intentar recuperación
            if (error.message.includes('foreign key constraint') || 
                error.message.includes('audit_logs_user_id_fkey') ||
                error.message.includes('column') && error.message.includes('does not exist')) {
                console.log('🔄 Intentando recuperación con estructura simplificada...');
                try {
                    await this.createTablesWithoutAuditLogs();
                    this.isInitialized = true;
                    console.log('✅ Recuperación exitosa - funcionando con estructura simplificada');
                    return;
                } catch (recoveryError) {
                    console.error('❌ Fallo en recuperación:', recoveryError.message);
                }
            }
            
            throw error;
        }
    }

    async createTablesWithoutAuditLogs() {
        const client = await this.pool.connect();
        
        try {
            console.log('🔧 Creando tablas esenciales con estructura compatible...');

            // Crear extensión para UUID si no existe
            await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

            // Tabla de usuarios administrativos - versión simplificada para compatibilidad
            await client.query(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL DEFAULT '',
                    role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR',
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Intentar agregar columnas adicionales de forma segura
            try {
                await client.query(`
                    DO $$
                    BEGIN
                        -- Agregar email si no existe
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='email') THEN
                            ALTER TABLE admin_users ADD COLUMN email VARCHAR(255) UNIQUE DEFAULT CONCAT(username, '@pigmea.local');
                        END IF;
                        
                        -- Agregar first_name si no existe
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='first_name') THEN
                            ALTER TABLE admin_users ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT '';
                        END IF;
                        
                        -- Agregar last_name si no existe
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='last_name') THEN
                            ALTER TABLE admin_users ADD COLUMN last_name VARCHAR(100) NOT NULL DEFAULT '';
                        END IF;
                        
                        -- Agregar permissions si no existe
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='permissions') THEN
                            ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
                        END IF;
                    END $$;
                `);
                console.log('✅ Columnas adicionales agregadas de forma segura');
            } catch (error) {
                console.log('⚠️ Algunas columnas no se pudieron agregar:', error.message);
            }

            // La tabla de pedidos ahora se crea por migración

            // Tabla de usuarios legacy
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'Operador',
                    display_name VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                );
            `);

            // Tabla de auditoría simple
            await client.query(`
                CREATE TABLE IF NOT EXISTS audit_log (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_role VARCHAR(50) NOT NULL,
                    action TEXT NOT NULL,
                    pedido_id VARCHAR(255),
                    details JSONB
                );
            `);

            console.log('✅ Tablas esenciales creadas sin problemas');
            
        } finally {
            client.release();
        }
    }

    async ensureAdminUsersColumns(client) {
        try {
            // Verificar qué columnas existen en la tabla admin_users
            const columnsResult = await client.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'admin_users'
                AND table_schema = 'public'
            `);

            const existingColumns = columnsResult.rows.map(row => row.column_name);
            console.log('📋 Columnas existentes en admin_users:', existingColumns.join(', '));

            // Lista de columnas requeridas y sus definiciones
            const requiredColumns = {
                'email': 'VARCHAR(255) UNIQUE',
                'first_name': 'VARCHAR(100) NOT NULL DEFAULT \'\'',
                'last_name': 'VARCHAR(100) NOT NULL DEFAULT \'\'',
                'password_hash': 'VARCHAR(255)',
                'permissions': 'JSONB DEFAULT \'[]\'::jsonb',
                'is_active': 'BOOLEAN DEFAULT true',
                'last_login': 'TIMESTAMP WITH TIME ZONE',
                'last_activity': 'TIMESTAMP WITH TIME ZONE',
                'ip_address': 'INET',
                'user_agent': 'TEXT',
                'updated_at': 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
            };

            // Agregar columnas faltantes
            for (const [columnName, columnDefinition] of Object.entries(requiredColumns)) {
                if (!existingColumns.includes(columnName)) {
                    console.log(`➕ Agregando columna faltante: ${columnName}`);
                    try {
                        await client.query(`
                            ALTER TABLE admin_users
                            ADD COLUMN ${columnName} ${columnDefinition}
                        `);
                        console.log(`✅ Columna ${columnName} agregada exitosamente`);
                    } catch (error) {
                        console.log(`⚠️ No se pudo agregar columna ${columnName}: ${error.message}`);
                        // Continuar con las demás columnas
                    }
                }
            }

            // Verificar y actualizar el constraint del rol si es necesario
            try {
                await client.query(`
                    DO $$
                    BEGIN
                        -- Eliminar constraint existente si existe
                        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_role_check') THEN
                            ALTER TABLE admin_users DROP CONSTRAINT admin_users_role_check;
                        END IF;

                        -- Agregar el constraint actualizado
                        ALTER TABLE admin_users
                        ADD CONSTRAINT admin_users_role_check
                        CHECK (role IN ('ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER'));
                    END $$;
                `);
                console.log('✅ Constraint de rol actualizado');
            } catch (error) {
                console.log('⚠️ No se pudo actualizar constraint de rol:', error.message);
            }

            // Migrar usuarios existentes que no tienen los campos requeridos
            await this.migrateExistingUsers(client);

        } catch (error) {
            console.log('⚠️ Error verificando columnas de admin_users:', error.message);
            // No lanzar error - el sistema puede continuar
        }
    }

    async migrateExistingUsers(client) {
        try {
            console.log('🔄 Verificando usuarios existentes...');

            // Actualizar usuarios que no tienen email
            const updateResult = await client.query(`
                UPDATE admin_users
                SET
                    email = COALESCE(NULLIF(email, ''), username || '@pigmea.local'),
                    first_name = COALESCE(NULLIF(first_name, ''), username),
                    last_name = COALESCE(NULLIF(last_name, ''), ''),
                    permissions = COALESCE(permissions, '[]'::jsonb)
                WHERE email IS NULL
                   OR email = ''
                   OR first_name IS NULL
                   OR first_name = ''
                   OR permissions IS NULL
            `);

            if (updateResult.rowCount > 0) {
                console.log(`✅ Migrados ${updateResult.rowCount} usuarios existentes`);
            } else {
                console.log('✅ Todos los usuarios ya están actualizados');
            }

        } catch (error) {
            console.log('⚠️ Error migrando usuarios:', error.message);
        }
    }

    async findLegacyUserById(id) {
        // Método específico para buscar en la tabla legacy users
        if (!this.pool || !this.isInitialized) {
            console.log('⚠️ Pool de conexiones no disponible para findLegacyUserById');
            return null;
        }

        try {
            const client = await this.pool.connect();
            try {
                console.log(`🔍 Buscando en tabla legacy users con ID: ${id}`);

                // Determinar el tipo de búsqueda según el formato del ID
                const isInteger = /^\d+$/.test(id);
                let result;

                if (isInteger) {
                    // Buscar por ID entero
                    result = await client.query('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
                } else {
                    // Buscar por ID string
                    result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
                }

                console.log(`📋 Resultado consulta legacy: ${result.rows.length} filas encontradas`);

                if (result.rows.length > 0) {
                    console.log(`✅ Usuario encontrado en tabla legacy: ${result.rows[0].username}`);
                    return {
                        ...result.rows[0],
                        isLegacy: true,
                        // Mapear campos para compatibilidad
                        displayName: result.rows[0].display_name || result.rows[0].username
                    };
                } else {
                    console.log(`❌ Usuario con ID ${id} no encontrado en tabla legacy`);
                    return null;
                }

            } finally {
                client.release();
            }
        } catch (error) {
            console.error(`❌ Error en findLegacyUserById para ID ${id}:`, error.message);
            return null;
        }
    }

    async createTables() {
        const client = await this.pool.connect();
        
        try {
            console.log('🔧 Iniciando creación/verificación de tablas...');

            // Crear extensión para UUID si no existe
            await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
            console.log('✅ Extensión uuid-ossp verificada');

            // PRIMERO: Tabla de usuarios administrativos (debe crearse ANTES que user_permissions)
            await client.query(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER')),
                    permissions JSONB DEFAULT '[]'::jsonb,
                    is_active BOOLEAN DEFAULT true,
                    last_login TIMESTAMP WITH TIME ZONE,
                    last_activity TIMESTAMP WITH TIME ZONE,
                    ip_address INET,
                    user_agent TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Tabla admin_users verificada');

            // Verificar y agregar columnas faltantes en admin_users si es necesario
            await this.ensureAdminUsersColumns(client);
            console.log('✅ Columnas de admin_users verificadas');

            // SEGUNDO: Tabla de permisos de usuario (DESPUÉS de admin_users)
            // Crear tabla sin claves foráneas primero para compatibilidad
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_permissions (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID,
                    permission_id VARCHAR(100) NOT NULL,
                    enabled BOOLEAN DEFAULT true,
                    granted_by UUID,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, permission_id)
                );
            `);

            // Intentar agregar claves foráneas de forma segura
            try {
                await client.query(`
                    DO $$ 
                    BEGIN
                        -- Verificar que la constraint no exista antes de crearla
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'user_permissions_user_id_fkey'
                        ) THEN
                            ALTER TABLE user_permissions 
                            ADD CONSTRAINT user_permissions_user_id_fkey 
                            FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'user_permissions_granted_by_fkey'
                        ) THEN
                            ALTER TABLE user_permissions 
                            ADD CONSTRAINT user_permissions_granted_by_fkey 
                            FOREIGN KEY (granted_by) REFERENCES admin_users(id);
                        END IF;
                    EXCEPTION WHEN OTHERS THEN
                        -- Si falla, continuar sin las claves foráneas
                        RAISE NOTICE 'No se pudieron crear las claves foráneas de user_permissions: %', SQLERRM;
                    END $$;
                `);
            } catch (fkError) {
                console.log('⚠️ Claves foráneas de user_permissions no creadas:', fkError.message);
            }

            // Índices y triggers
            await client.query(`
                -- Índices para mejorar el rendimiento
                CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
                CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);

                -- Trigger para actualizar el timestamp de updated_at
                CREATE OR REPLACE FUNCTION update_modified_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = now();
                    RETURN NEW;
                END;
                $$ language 'plpgsql';

                DROP TRIGGER IF EXISTS update_user_permissions_modtime ON user_permissions;
                CREATE TRIGGER update_user_permissions_modtime
                    BEFORE UPDATE ON user_permissions
                    FOR EACH ROW
                    EXECUTE PROCEDURE update_modified_column();
            `);
            console.log('✅ Tabla user_permissions verificada');

            // La tabla de pedidos ahora se crea por migración
            console.log('✅ Tabla pedidos verificada (creada por migración)');

            // Tabla de usuarios legacy
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'Operador',
                    display_name VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                );
            `);
            console.log('✅ Tabla users verificada');

            // Tabla de auditoría (legacy - sin claves foráneas)
            await client.query(`
                CREATE TABLE IF NOT EXISTS audit_log (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_role VARCHAR(50) NOT NULL,
                    action TEXT NOT NULL,
                    pedido_id VARCHAR(255),
                    details JSONB
                );
            `);
            console.log('✅ Tabla audit_log verificada');

            // Tabla de logs de auditoría administrativa (DESPUÉS de admin_users)
            await client.query(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID,
                    username VARCHAR(50) NOT NULL,
                    action VARCHAR(100) NOT NULL,
                    module VARCHAR(50) NOT NULL,
                    details TEXT,
                    ip_address INET,
                    user_agent TEXT,
                    affected_resource UUID,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Eliminar la clave foránea existente si hay problemas, luego recrearla
            await client.query(`
                DO $$ 
                BEGIN
                    -- Intentar eliminar la constraint existente si hay problemas
                    BEGIN
                        ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
                    EXCEPTION WHEN OTHERS THEN
                        -- Ignorar errores si la constraint no existe
                        NULL;
                    END;
                    
                    -- Crear la constraint solo si no existe
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint 
                        WHERE conname = 'audit_logs_user_id_fkey'
                    ) THEN
                        ALTER TABLE audit_logs 
                        ADD CONSTRAINT audit_logs_user_id_fkey 
                        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    -- Si falla, continuar sin la constraint - el sistema funcionará igual
                    RAISE NOTICE 'No se pudo crear la clave foránea audit_logs_user_id_fkey: %', SQLERRM;
                END $$;
            `);
            console.log('⚠️ Tabla audit_logs y clave foránea procesadas (puede haber avisos)');

            // TABLA DE COMENTARIOS
            await client.query(`
                CREATE TABLE IF NOT EXISTS pedido_comments (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    pedido_id VARCHAR(50) NOT NULL,
                    user_id UUID,
                    user_role VARCHAR(20) NOT NULL,
                    username VARCHAR(50) NOT NULL,
                    message TEXT NOT NULL,
                    is_system_message BOOLEAN DEFAULT false,
                    is_edited BOOLEAN DEFAULT false,
                    edited_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Tabla pedido_comments creada');

            // TABLA DE VENDEDORES
            await client.query(`
                CREATE TABLE IF NOT EXISTS vendedores (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    nombre VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255),
                    telefono VARCHAR(50),
                    activo BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Tabla vendedores creada');

            // Índices para mejorar performance
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_pedidos_etapa ON pedidos(etapa_actual);
                CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente);
                CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega ON pedidos(fecha_entrega);
                CREATE INDEX IF NOT EXISTS idx_pedidos_secuencia ON pedidos(secuencia_pedido);
                CREATE INDEX IF NOT EXISTS idx_pedidos_numeros_compra_gin ON pedidos USING gin(numeros_compra);
                CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
                CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
                CREATE INDEX IF NOT EXISTS idx_audit_user_role ON audit_log(user_role);
                CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
                CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
                CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
                CREATE INDEX IF NOT EXISTS idx_pedido_comments_pedido_id ON pedido_comments(pedido_id);
                CREATE INDEX IF NOT EXISTS idx_pedido_comments_user_id ON pedido_comments(user_id);
                CREATE INDEX IF NOT EXISTS idx_pedido_comments_created_at ON pedido_comments(created_at);
                CREATE INDEX IF NOT EXISTS idx_vendedores_nombre ON vendedores(nombre);
                CREATE INDEX IF NOT EXISTS idx_vendedores_activo ON vendedores(activo);
            `);
            console.log('✅ Índices verificados');

            // Función para actualizar updated_at automáticamente
            await client.query(`
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            `);

            // Trigger para actualizar updated_at en pedidos
            await client.query(`
                DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
                CREATE TRIGGER update_pedidos_updated_at 
                    BEFORE UPDATE ON pedidos 
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            `);

            // Trigger para actualizar updated_at en admin_users
            await client.query(`
                DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
                CREATE TRIGGER update_admin_users_updated_at 
                    BEFORE UPDATE ON admin_users 
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            `);

            // Trigger para actualizar updated_at en vendedores
            await client.query(`
                DROP TRIGGER IF EXISTS update_vendedores_updated_at ON vendedores;
                CREATE TRIGGER update_vendedores_updated_at 
                    BEFORE UPDATE ON vendedores 
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            `);
            console.log('✅ Triggers configurados');

            // ✅ Añadir columna vendedor_id a pedidos si no existe
            await client.query(`
                DO $$ 
                DECLARE
                    vendedor_column_exists BOOLEAN;
                BEGIN
                    -- Verificar si la columna vendedor_id ya existe
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'pedidos' AND column_name = 'vendedor_id'
                    ) THEN
                        -- Crear columna vendedor_id
                        ALTER TABLE pedidos ADD COLUMN vendedor_id UUID;
                        CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor_id ON pedidos(vendedor_id);
                        
                        -- Añadir foreign key
                        ALTER TABLE pedidos
                        ADD CONSTRAINT fk_pedidos_vendedor
                        FOREIGN KEY (vendedor_id)
                        REFERENCES vendedores(id)
                        ON DELETE SET NULL;
                        
                        RAISE NOTICE '✅ Columna vendedor_id creada';
                        
                        -- Verificar si existe la columna legacy "vendedor" (string)
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'pedidos' AND column_name = 'vendedor'
                        ) INTO vendedor_column_exists;
                        
                        -- Solo migrar datos si existe la columna legacy
                        IF vendedor_column_exists THEN
                            -- Crear vendedores para cada nombre único
                            INSERT INTO vendedores (nombre, activo)
                            SELECT DISTINCT TRIM(vendedor) as nombre, true
                            FROM pedidos
                            WHERE vendedor IS NOT NULL 
                              AND TRIM(vendedor) != ''
                              AND NOT EXISTS (
                                SELECT 1 FROM vendedores v 
                                WHERE LOWER(v.nombre) = LOWER(TRIM(pedidos.vendedor))
                              )
                            ON CONFLICT DO NOTHING;
                            
                            -- Actualizar pedidos con el vendedor_id correspondiente
                            UPDATE pedidos p
                            SET vendedor_id = v.id
                            FROM vendedores v
                            WHERE LOWER(TRIM(p.vendedor)) = LOWER(v.nombre)
                              AND p.vendedor IS NOT NULL
                              AND p.vendedor != ''
                              AND p.vendedor_id IS NULL;
                            
                            RAISE NOTICE '✅ Datos migrados desde columna legacy "vendedor"';
                        ELSE
                            RAISE NOTICE '⚠️ Columna legacy "vendedor" no existe - migración de datos omitida';
                        END IF;
                    ELSE
                        RAISE NOTICE '✅ Columna vendedor_id ya existe';
                    END IF;
                END $$;
            `);
            console.log('✅ Columna vendedor_id verificada/creada');

            console.log('🎉 Todas las tablas han sido verificadas/creadas exitosamente');

            
        } finally {
            client.release();
        }
    }

    // === MÉTODOS PARA PEDIDOS ===

    async create(pedido) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            // Si se proporciona clienteId, asegurarse de que el nombre del cliente coincida
            if (pedido.clienteId) {
                const clienteResult = await client.query('SELECT nombre FROM clientes WHERE id = $1', [pedido.clienteId]);
                if (clienteResult.rowCount > 0) {
                    pedido.cliente = clienteResult.rows[0].nombre;
                }
            }

            // Si se proporciona vendedorId, obtener el nombre del vendedor
            if (pedido.vendedorId) {
                const vendedorResult = await client.query('SELECT nombre FROM vendedores WHERE id = $1', [pedido.vendedorId]);
                if (vendedorResult.rowCount > 0) {
                    pedido.vendedorNombre = vendedorResult.rows[0].nombre;
                } else {
                    // Si el vendedor no existe, establecer vendedorId como null
                    console.warn(`⚠️ Vendedor ${pedido.vendedorId} no encontrado. Estableciendo vendedorId como null.`);
                    pedido.vendedorId = null;
                    pedido.vendedorNombre = null;
                }
            }

            // ✅ Ya no necesitamos modificar pedido.data aquí
            // El clienteId se guardará directamente en la columna cliente_id
            // Y también estará en el JSON cuando se haga JSON.stringify(pedido) más adelante

            // Verificar qué columnas existen en la tabla
            const columnsResult = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'pedidos' 
                AND table_schema = 'public'
            `);
            
            const existingColumns = columnsResult.rows.map(row => row.column_name);
            
            // Lista base de columnas que siempre deben existir
            const baseColumns = [
                'id', 'numero_pedido_cliente', 'cliente', 'fecha_pedido', 'fecha_entrega',
                'etapa_actual', 'prioridad', 'secuencia_pedido', 'cantidad_piezas',
                'observaciones', 'datos_tecnicos', 'antivaho', 'camisa', 'data', 'cliente_id'
            ];
            
            // Columnas opcionales que pueden no existir
            const optionalColumns = ['nueva_fecha_entrega', 'numeros_compra', 'vendedor', 'vendedor_id', 'cliche_info_adicional', 'anonimo', 'compra_cliche', 'recepcion_cliche', 'observaciones_material', 'microperforado', 'macroperforado', 'anonimo_post_impresion'];
            
            // Construir lista de columnas a insertar
            const columnsToInsert = baseColumns.filter(col => existingColumns.includes(col));
            optionalColumns.forEach(col => {
                if (existingColumns.includes(col)) {
                    columnsToInsert.push(col);
                }
            });
            
            // Construir lista de valores correspondientes
            const baseValues = [
                pedido.id,
                pedido.numeroPedidoCliente,
                pedido.cliente,
                pedido.fechaPedido ? new Date(pedido.fechaPedido) : null,
                pedido.fechaEntrega ? new Date(pedido.fechaEntrega) : null,
                pedido.etapaActual,
                pedido.prioridad,
                pedido.secuenciaPedido,
                pedido.cantidadPiezas,
                pedido.observaciones,
                JSON.stringify(pedido.datosTecnicos || {}),
                pedido.antivaho || false,
                pedido.camisa,
                JSON.stringify(pedido),
                pedido.clienteId || null
            ];
            
            const values = [...baseValues];
            
            // Agregar valores opcionales solo si las columnas existen
            if (existingColumns.includes('nueva_fecha_entrega')) {
                values.push(pedido.nuevaFechaEntrega ? new Date(pedido.nuevaFechaEntrega) : null);
            }
            if (existingColumns.includes('numeros_compra')) {
                // Convertir array de strings a JSONB
                const numerosCompraJson = pedido.numerosCompra && Array.isArray(pedido.numerosCompra) 
                    ? JSON.stringify(pedido.numerosCompra) 
                    : '[]';
                values.push(numerosCompraJson);
            }
            if (existingColumns.includes('vendedor')) {
                values.push(pedido.vendedor || null);
            }
            if (existingColumns.includes('vendedor_id')) {
                values.push(pedido.vendedorId || null);
            }
            if (existingColumns.includes('cliche_info_adicional')) {
                values.push(pedido.clicheInfoAdicional || null);
            }
            if (existingColumns.includes('anonimo')) {
                values.push(pedido.anonimo || false);
            }
            if (existingColumns.includes('compra_cliche')) {
                values.push(pedido.compraCliche ? new Date(pedido.compraCliche) : null);
            }
            if (existingColumns.includes('recepcion_cliche')) {
                values.push(pedido.recepcionCliche ? new Date(pedido.recepcionCliche) : null);
            }
            if (existingColumns.includes('observaciones_material')) {
                values.push(pedido.observacionesMaterial || null);
            }
            if (existingColumns.includes('microperforado')) {
                values.push(pedido.microperforado || false);
            }
            if (existingColumns.includes('macroperforado')) {
                values.push(pedido.macroperforado || false);
            }
            if (existingColumns.includes('anonimo_post_impresion')) {
                values.push(pedido.anonimoPostImpresion || null);
            }
            
            // Construir placeholders para los valores
            const placeholders = columnsToInsert.map((_, index) => `$${index + 1}`).join(', ');
            
            const query = `
                INSERT INTO pedidos (${columnsToInsert.join(', ')})
                VALUES (${placeholders})
                RETURNING *;
            `;

            await client.query(query, values);
            return pedido;
        } finally {
            client.release();
        }
    }

    async update(pedido) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            // Si se proporciona clienteId, asegurarse de que el nombre del cliente coincida
            if (pedido.clienteId) {
                const clienteResult = await client.query('SELECT nombre FROM clientes WHERE id = $1', [pedido.clienteId]);
                if (clienteResult.rowCount > 0) {
                    pedido.cliente = clienteResult.rows[0].nombre;
                }
            }

            // Si se proporciona vendedorId, obtener el nombre del vendedor
            if (pedido.vendedorId) {
                const vendedorResult = await client.query('SELECT nombre FROM vendedores WHERE id = $1', [pedido.vendedorId]);
                if (vendedorResult.rowCount > 0) {
                    pedido.vendedorNombre = vendedorResult.rows[0].nombre;
                } else {
                    // Si el vendedor no existe, establecer vendedorId como null
                    console.warn(`⚠️ Vendedor ${pedido.vendedorId} no encontrado. Estableciendo vendedorId como null.`);
                    pedido.vendedorId = null;
                    pedido.vendedorNombre = null;
                }
            }

            // ✅ Ya no necesitamos modificar pedido.data aquí
            // El clienteId se guardará directamente en la columna cliente_id
            // Y también estará en el JSON cuando se haga JSON.stringify(pedido) más adelante

            // Verificar qué columnas existen dinámicamente para evitar errores
            const columnsResult = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'pedidos' 
                AND column_name IN ('nueva_fecha_entrega', 'numeros_compra', 'vendedor', 'vendedor_id', 'cliche_info_adicional', 'anonimo', 'compra_cliche', 'recepcion_cliche', 'observaciones_material')
            `);
            
            const existingColumns = columnsResult.rows.map(row => row.column_name);
            const hasNuevaFecha = existingColumns.includes('nueva_fecha_entrega');
            const hasNumerosCompra = existingColumns.includes('numeros_compra');
            const hasVendedor = existingColumns.includes('vendedor');
            const hasVendedorId = existingColumns.includes('vendedor_id');
            const hasClicheInfo = existingColumns.includes('cliche_info_adicional');
            const hasAnonimo = existingColumns.includes('anonimo');
            const hasCompraCliche = existingColumns.includes('compra_cliche');
            const hasRecepcionCliche = existingColumns.includes('recepcion_cliche');
            const hasObservacionesMaterial = existingColumns.includes('observaciones_material');
            const hasMicroperforado = existingColumns.includes('microperforado');
            const hasMacroperforado = existingColumns.includes('macroperforado');
            const hasAnonimoPostImpresion = existingColumns.includes('anonimo_post_impresion');

            // Construir query dinámicamente basado en columnas existentes
            const updateFields = [];
            const values = [pedido.id]; // $1
            let paramIndex = 2;

            // Campos base en orden
            updateFields.push(`numero_pedido_cliente = $${paramIndex++}`);
            values.push(pedido.numeroPedidoCliente);

            updateFields.push(`cliente = $${paramIndex++}`);
            values.push(pedido.cliente);

            updateFields.push(`fecha_pedido = $${paramIndex++}`);
            values.push(pedido.fechaPedido ? new Date(pedido.fechaPedido) : null);

            updateFields.push(`fecha_entrega = $${paramIndex++}`);
            values.push(pedido.fechaEntrega ? new Date(pedido.fechaEntrega) : null);

            // Agregar nueva_fecha_entrega solo si la columna existe
            if (hasNuevaFecha) {
                updateFields.push(`nueva_fecha_entrega = $${paramIndex++}`);
                values.push(pedido.nuevaFechaEntrega ? new Date(pedido.nuevaFechaEntrega) : null);
            }

            updateFields.push(`etapa_actual = $${paramIndex++}`);
            values.push(pedido.etapaActual);

            updateFields.push(`prioridad = $${paramIndex++}`);
            values.push(pedido.prioridad);

            updateFields.push(`secuencia_pedido = $${paramIndex++}`);
            values.push(pedido.secuenciaPedido);

            updateFields.push(`cantidad_piezas = $${paramIndex++}`);
            values.push(pedido.cantidadPiezas);

            updateFields.push(`observaciones = $${paramIndex++}`);
            values.push(pedido.observaciones);

            updateFields.push(`datos_tecnicos = $${paramIndex++}`);
            values.push(JSON.stringify(pedido.datosTecnicos || {}));

            updateFields.push(`antivaho = $${paramIndex++}`);
            values.push(pedido.antivaho || false);

            updateFields.push(`camisa = $${paramIndex++}`);
            values.push(pedido.camisa);

            // Agregar numero_compra solo si la columna existe
            if (hasNumerosCompra) {
                updateFields.push(`numeros_compra = $${paramIndex++}`);
                // Convertir array de strings a JSONB
                const numerosCompraJson = pedido.numerosCompra && Array.isArray(pedido.numerosCompra) 
                    ? JSON.stringify(pedido.numerosCompra) 
                    : '[]';
                values.push(numerosCompraJson);
            }

            // Agregar vendedor solo si la columna existe
            if (hasVendedor) {
                updateFields.push(`vendedor = $${paramIndex++}`);
                values.push(pedido.vendedor || null);
            }

            // Agregar vendedor_id solo si la columna existe
            if (hasVendedorId) {
                updateFields.push(`vendedor_id = $${paramIndex++}`);
                values.push(pedido.vendedorId || null);
            }

            // Agregar cliche_info_adicional solo si la columna existe
            if (hasClicheInfo) {
                updateFields.push(`cliche_info_adicional = $${paramIndex++}`);
                values.push(pedido.clicheInfoAdicional || null);
            }

            // Agregar anonimo solo si la columna existe
            if (hasAnonimo) {
                updateFields.push(`anonimo = $${paramIndex++}`);
                values.push(pedido.anonimo || false);
            }

            // Agregar compra_cliche solo si la columna existe
            if (hasCompraCliche) {
                updateFields.push(`compra_cliche = $${paramIndex++}`);
                values.push(pedido.compraCliche ? new Date(pedido.compraCliche) : null);
            }

            // Agregar recepcion_cliche solo si la columna existe
            if (hasRecepcionCliche) {
                updateFields.push(`recepcion_cliche = $${paramIndex++}`);
                values.push(pedido.recepcionCliche ? new Date(pedido.recepcionCliche) : null);
            }

            // Agregar observaciones_material solo si la columna existe
            if (hasObservacionesMaterial) {
                updateFields.push(`observaciones_material = $${paramIndex++}`);
                values.push(pedido.observacionesMaterial || null);
            }

            // Agregar microperforado solo si la columna existe
            if (hasMicroperforado) {
                updateFields.push(`microperforado = $${paramIndex++}`);
                values.push(pedido.microperforado || false);
            }

            // Agregar macroperforado solo si la columna existe
            if (hasMacroperforado) {
                updateFields.push(`macroperforado = $${paramIndex++}`);
                values.push(pedido.macroperforado || false);
            }

            // Agregar anonimo_post_impresion solo si la columna existe
            if (hasAnonimoPostImpresion) {
                updateFields.push(`anonimo_post_impresion = $${paramIndex++}`);
                values.push(pedido.anonimoPostImpresion || null);
            }

            updateFields.push(`data = $${paramIndex++}`);
            values.push(JSON.stringify(pedido));

            updateFields.push(`cliente_id = $${paramIndex++}`);
            values.push(pedido.clienteId || null);

            updateFields.push('updated_at = CURRENT_TIMESTAMP');

            const query = `
                UPDATE pedidos SET 
                    ${updateFields.join(', ')}
                WHERE id = $1
                RETURNING *;
            `;

            console.log(`🔄 Actualizando pedido ${pedido.id} con columnas disponibles:`, 
                      `nueva_fecha_entrega=${hasNuevaFecha}, numeros_compra=${hasNumerosCompra}, vendedor=${hasVendedor}, cliche_info=${hasClicheInfo}, anonimo=${hasAnonimo}`);

            const result = await client.query(query, values);
            if (result.rowCount === 0) throw new Error(`Pedido ${pedido.id} no encontrado para actualizar`);
            return pedido;
        } finally {
            client.release();
        }
    }

    async findById(id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const result = await client.query('SELECT data FROM pedidos WHERE id = $1', [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0].data;
            
        } finally {
            client.release();
        }
    }

    async getAll() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const result = await client.query('SELECT data FROM pedidos ORDER BY secuencia_pedido DESC');
            return result.rows.map(row => row.data);
            
        } finally {
            client.release();
        }
    }

    async delete(id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const result = await client.query('DELETE FROM pedidos WHERE id = $1', [id]);
            
            if (result.rowCount === 0) {
                throw new Error(`Pedido ${id} no encontrado para eliminar`);
            }
            
            return true;
            
        } finally {
            client.release();
        }
    }

    async clear() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            await client.query('DELETE FROM pedidos');
            
        } finally {
            client.release();
        }
    }

    async bulkInsert(pedidos) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            for (const pedido of pedidos) {
                await this.create(pedido);
            }
            
            await client.query('COMMIT');
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async searchPedidos(searchTerm) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const query = `
                SELECT data FROM pedidos 
                WHERE 
                    numero_pedido_cliente ILIKE $1 OR
                    cliente ILIKE $1 OR
                    EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements_text(numeros_compra) AS numero
                        WHERE numero ILIKE $1
                    ) OR
                    etapa_actual ILIKE $1 OR
                    observaciones ILIKE $1
                ORDER BY secuencia_pedido DESC
            `;
            
            const searchPattern = `%${searchTerm}%`;
            const result = await client.query(query, [searchPattern]);
            return result.rows.map(row => row.data);
            
        } finally {
            client.release();
        }
    }

    // === MÉTODOS PARA VENDEDORES ===

    async getAllVendedores() {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM vendedores ORDER BY nombre ASC;';
            const result = await client.query(query);
            // Transformar snake_case a camelCase
            return result.rows.map(row => ({
                id: row.id,
                nombre: row.nombre,
                email: row.email,
                telefono: row.telefono,
                activo: row.activo,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        } finally {
            client.release();
        }
    }

    async getVendedorById(id) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM vendedores WHERE id = $1;';
            const result = await client.query(query, [id]);
            if (!result.rows[0]) return null;
            // Transformar snake_case a camelCase
            const row = result.rows[0];
            return {
                id: row.id,
                nombre: row.nombre,
                email: row.email,
                telefono: row.telefono,
                activo: row.activo,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        } finally {
            client.release();
        }
    }

    async createVendedor(vendedorData) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const { nombre, email, telefono, activo } = vendedorData;
            const query = `
                INSERT INTO vendedores (nombre, email, telefono, activo)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const values = [nombre, email, telefono, activo !== undefined ? activo : true];
            const result = await client.query(query, values);
            // Transformar snake_case a camelCase
            const row = result.rows[0];
            return {
                id: row.id,
                nombre: row.nombre,
                email: row.email,
                telefono: row.telefono,
                activo: row.activo,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        } finally {
            client.release();
        }
    }

    async updateVendedor(id, vendedorData) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const setParts = [];
            const values = [];
            let valueIndex = 1;

            const validKeys = ['nombre', 'email', 'telefono', 'activo'];
            for (const key of validKeys) {
                if (vendedorData[key] !== undefined) {
                    setParts.push(`${key} = $${valueIndex++}`);
                    values.push(vendedorData[key]);
                }
            }

            if (setParts.length === 0) {
                return this.getVendedorById(id);
            }

            values.push(id);
            const query = `
                UPDATE vendedores
                SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${valueIndex}
                RETURNING *;
            `;

            const result = await client.query(query, values);
            // Transformar snake_case a camelCase
            const row = result.rows[0];
            return {
                id: row.id,
                nombre: row.nombre,
                email: row.email,
                telefono: row.telefono,
                activo: row.activo,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        } finally {
            client.release();
        }
    }

    async deleteVendedor(id) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM vendedores WHERE id = $1', [id]);
        } finally {
            client.release();
        }
    }

    // === MÉTODOS PARA CLIENTES ===

    async createCliente(clienteData) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            console.log('🔍 createCliente - Datos recibidos:', JSON.stringify(clienteData, null, 2));
            
            const query = `
                INSERT INTO clientes (nombre, razon_social, cif, telefono, email, direccion_fiscal, codigo_postal, poblacion, provincia, pais, persona_contacto, notas, estado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *;
            `;
            const values = [
                clienteData.nombre,
                clienteData.razon_social || null,
                clienteData.cif || null,
                clienteData.telefono || null,
                clienteData.email || null,
                // Mapeo: direccion (frontend) -> direccion_fiscal (backend)
                clienteData.direccion_fiscal || clienteData.direccion || null,
                clienteData.codigo_postal || null,
                clienteData.poblacion || null,
                clienteData.provincia || null,
                clienteData.pais || null,
                clienteData.persona_contacto || null,
                // Mapeo: observaciones (frontend) -> notas (backend)
                clienteData.notas || clienteData.observaciones || null,
                clienteData.estado || 'Activo'
            ];
            
            console.log('🔍 createCliente - Query:', query);
            console.log('🔍 createCliente - Values:', values);
            
            const result = await client.query(query, values);
            const newCliente = result.rows[0];

            if (newCliente.direccion_fiscal !== undefined) {
                newCliente.direccion = newCliente.direccion_fiscal;
                delete newCliente.direccion_fiscal;
            }
            if (newCliente.notas !== undefined) {
                newCliente.observaciones = newCliente.notas;
                delete newCliente.notas;
            }
            
            console.log('✅ Cliente creado exitosamente:', newCliente.id);
            return newCliente;
        } finally {
            client.release();
        }
    }

    async updateCliente(id, clienteData) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            console.log('🔍 updateCliente - Datos recibidos:', JSON.stringify(clienteData, null, 2));
            
            const setParts = [];
            const values = [];
            let valueIndex = 1;

            // Crear objeto limpio solo con campos válidos y mapeo correcto
            const cleanData = {};
            
            // Mapeo directo de campos que coinciden
            const directFields = ['nombre', 'razon_social', 'cif', 'telefono', 'email', 'codigo_postal', 'poblacion', 'provincia', 'pais', 'persona_contacto', 'estado', 'fecha_baja'];
            directFields.forEach(field => {
                if (clienteData[field] !== undefined) {
                    cleanData[field] = clienteData[field];
                }
            });
            
            // Mapeo específico de campos con nombres diferentes
            if (clienteData.direccion !== undefined || clienteData.direccion_fiscal !== undefined) {
                cleanData.direccion_fiscal = clienteData.direccion_fiscal || clienteData.direccion;
            }
            
            if (clienteData.observaciones !== undefined || clienteData.notas !== undefined) {
                cleanData.notas = clienteData.notas || clienteData.observaciones;
            }
            
            console.log('🔄 updateCliente - Datos mapeados:', JSON.stringify(cleanData, null, 2));

            // Construir query con solo campos válidos
            Object.keys(cleanData).forEach(key => {
                if (cleanData[key] !== undefined) {
                    setParts.push(`${key} = $${valueIndex++}`);
                    values.push(cleanData[key]);
                }
            });

            if (setParts.length === 0) {
                console.log('⚠️ No hay campos válidos para actualizar');
                return this.getClienteById(id);
            }

            values.push(id);
            const query = `
                UPDATE clientes
                SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${valueIndex}
                RETURNING *;
            `;
            
            console.log('🔍 Query SQL:', query);
            console.log('🔍 Values:', values);

            const result = await client.query(query, values);
            if (result.rowCount === 0) throw new Error(`Cliente con ID ${id} no encontrado.`);
            
            const updatedCliente = result.rows[0];

            // Map backend fields to frontend fields before returning
            if (updatedCliente.direccion_fiscal !== undefined) {
                updatedCliente.direccion = updatedCliente.direccion_fiscal;
                delete updatedCliente.direccion_fiscal;
            }
            if (updatedCliente.notas !== undefined) {
                updatedCliente.observaciones = updatedCliente.notas;
                delete updatedCliente.notas;
            }
            
            console.log('✅ Cliente actualizado exitosamente:', updatedCliente.id);
            return updatedCliente;
        } finally {
            client.release();
        }
    }

    async getAllClientes({ page = 1, limit = 20, sortBy = 'nombre', sortOrder = 'ASC', searchTerm = '', estado = null }) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            const whereClauses = [];
            const queryParams = [];

            if (searchTerm) {
                whereClauses.push(`(nombre ILIKE $${queryParams.length + 1} OR cif ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`);
                queryParams.push(`%${searchTerm}%`);
            }

            if (estado) {
                whereClauses.push(`estado = $${queryParams.length + 1}`);
                queryParams.push(estado);
            }

            const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
            
            const validSortColumns = ['nombre', 'cif', 'poblacion', 'estado', 'created_at', 'total_pedidos'];
            const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'nombre';
            const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            const baseQuery = `
                FROM clientes c
                LEFT JOIN (
                    SELECT cliente_id, COUNT(*) as total_pedidos
                    FROM pedidos
                    GROUP BY cliente_id
                ) p ON c.id = p.cliente_id
                ${where}
            `;

            const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
            const totalResult = await client.query(countQuery, queryParams);
            const total = parseInt(totalResult.rows[0].total, 10);

            const dataQuery = `
                SELECT c.*, COALESCE(p.total_pedidos, 0) as total_pedidos
                ${baseQuery}
                ORDER BY ${safeSortBy} ${safeSortOrder}
                LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
            `;
            queryParams.push(limit, offset);

            const dataResult = await client.query(dataQuery, queryParams);

            return {
                data: dataResult.rows,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } finally {
            client.release();
        }
    }

    async getAllClientesSimple() {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT id, nombre
                FROM clientes
                WHERE estado = 'Activo'
                ORDER BY nombre ASC;
            `;
            const result = await client.query(query);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async getClienteById(id) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT c.*,
                       COALESCE(p_activos.count, 0) as pedidos_activos,
                       COALESCE(p_total.count, 0) as pedidos_historicos,
                       p_total.ultima_fecha_pedido
                FROM clientes c
                LEFT JOIN (
                    SELECT cliente_id, COUNT(*) as count
                    FROM pedidos
                    WHERE etapa_actual NOT IN ('Entregado', 'Cancelado')
                    GROUP BY cliente_id
                ) p_activos ON c.id = p_activos.cliente_id
                LEFT JOIN (
                    SELECT cliente_id, COUNT(*) as count, MAX(fecha_pedido) as ultima_fecha_pedido
                    FROM pedidos
                    GROUP BY cliente_id
                ) p_total ON c.id = p_total.cliente_id
                WHERE c.id = $1;
            `;
            const result = await client.query(query, [id]);
            const cliente = result.rows[0] || null;
            if (cliente) {
                if (cliente.direccion_fiscal !== undefined) {
                    cliente.direccion = cliente.direccion_fiscal;
                    delete cliente.direccion_fiscal;
                }
                if (cliente.notas !== undefined) {
                    cliente.observaciones = cliente.notas;
                    delete cliente.notas;
                }
            }
            return cliente;
        } finally {
            client.release();
        }
    }

    async getClienteHistorialPedidos(id, { page = 1, limit = 10 }) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;

            const countQuery = "SELECT COUNT(*) as total FROM pedidos WHERE cliente_id = $1 OR data->>'clienteId' = $1::text";
            const totalResult = await client.query(countQuery, [id]);
            const total = parseInt(totalResult.rows[0].total, 10);

            const dataQuery = `
                SELECT id, data->>'numeroPedidoCliente' as numero_pedido_cliente, etapa_actual, fecha_pedido, fecha_entrega, (data->>'cantidadPiezas')::int as cantidad_piezas
                FROM pedidos
                WHERE cliente_id = $1 OR data->>'clienteId' = $1::text
                ORDER BY fecha_pedido DESC
                LIMIT $2 OFFSET $3
            `;
            const dataResult = await client.query(dataQuery, [id, limit, offset]);

            return {
                data: dataResult.rows,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } finally {
            client.release();
        }
    }

    async getClientePedidos(clienteId, estado = null) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            let whereClause = "WHERE (cliente_id = $1 OR data->>'clienteId' = $1::text)";
            const queryParams = [clienteId];

            // Filtrar por estado de pedido
            if (estado === 'activo') {
                whereClause += ` AND etapa_actual NOT IN ('COMPLETADO', 'ARCHIVADO')`;
            } else if (estado === 'completado') {
                whereClause += ` AND etapa_actual = 'COMPLETADO'`;
            } else if (estado === 'archivado') {
                whereClause += ` AND etapa_actual = 'ARCHIVADO'`;
            } else if (estado === 'preparacion') {
                // Solo pedidos en PREPARACION y PENDIENTE
                whereClause += ` AND etapa_actual IN ('PREPARACION', 'PENDIENTE')`;
            } else if (estado === 'produccion') {
                // Solo pedidos en IMPRESION_* y POST_* (excluyendo PREPARACION y PENDIENTE)
                whereClause += ` AND etapa_actual IN (
                    'IMPRESION_WM1', 'IMPRESION_GIAVE', 'IMPRESION_WM3', 'IMPRESION_ANON',
                    'POST_LAMINACION_SL2', 'POST_LAMINACION_NEXUS',
                    'POST_REBOBINADO_S2DT', 'POST_REBOBINADO_PROSLIT',
                    'POST_PERFORACION_MIC', 'POST_PERFORACION_MAC', 'POST_REBOBINADO_TEMAC'
                )`;
            }

            const query = `
                SELECT 
                    id,
                    data,
                    etapa_actual,
                    fecha_pedido,
                    fecha_entrega,
                    created_at,
                    updated_at
                FROM pedidos
                ${whereClause}
                ORDER BY created_at DESC
            `;

            const result = await client.query(query, queryParams);
            
            // Transformar los pedidos para que tengan el formato esperado
            const pedidos = result.rows.map(row => {
                const pedidoData = row.data || {};
                return {
                    id: row.id,
                    ...pedidoData,
                    etapaActual: row.etapa_actual,
                    fechaCreacion: pedidoData.fechaCreacion || row.fecha_pedido || row.created_at,
                    fechaEntrega: pedidoData.fechaEntrega || row.fecha_entrega || null,
                    fechaActualizacion: row.updated_at,
                };
            });

            return pedidos;
        } finally {
            client.release();
        }
    }

    async getClienteEstadisticas(clienteId) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT 
                    COUNT(*) FILTER (WHERE etapa_actual IN (
                        'PREPARACION', 'PENDIENTE',
                        'IMPRESION_WM1', 'IMPRESION_GIAVE', 'IMPRESION_WM3', 'IMPRESION_ANON',
                        'POST_LAMINACION_SL2', 'POST_LAMINACION_NEXUS',
                        'POST_REBOBINADO_S2DT', 'POST_REBOBINADO_PROSLIT',
                        'POST_PERFORACION_MIC', 'POST_PERFORACION_MAC', 'POST_REBOBINADO_TEMAC'
                    )) as pedidos_en_produccion,
                    COUNT(*) FILTER (WHERE etapa_actual NOT IN ('COMPLETADO', 'ARCHIVADO', 'CANCELADO')) as pedidos_activos,
                    COUNT(*) FILTER (WHERE etapa_actual = 'COMPLETADO') as pedidos_completados,
                    COUNT(*) FILTER (WHERE etapa_actual = 'ARCHIVADO') as pedidos_archivados,
                    COUNT(*) as total_pedidos,
                    SUM((data->>'metros')::numeric) FILTER (WHERE etapa_actual = 'COMPLETADO') as metros_producidos,
                    MAX(COALESCE(fecha_pedido, created_at)) as ultimo_pedido_fecha
                FROM pedidos
                WHERE cliente_id = $1 OR data->>'clienteId' = $1::text
            `;

            const result = await client.query(query, [clienteId]);
            return result.rows[0] || {
                pedidos_en_produccion: 0,
                pedidos_activos: 0,
                pedidos_completados: 0,
                pedidos_archivados: 0,
                total_pedidos: 0,
                metros_producidos: 0,
                ultimo_pedido_fecha: null
            };
        } finally {
            client.release();
        }
    }

    async getClienteStats() {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM obtener_estadisticas_clientes();');
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async deleteCliente(id) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        return this.updateCliente(id, { estado: 'Archivado', fecha_baja: new Date() });
    }

    async deleteClientePermanently(id, deletePedidos = false) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            let pedidosEliminadosIds = [];
            
            // Si se solicita eliminar los pedidos también
            if (deletePedidos) {
                // Primero eliminamos los comentarios de los pedidos del cliente
                await client.query(`
                    DELETE FROM pedido_comments
                    WHERE pedido_id IN (
                        SELECT id FROM pedidos WHERE cliente_id = $1
                    )
                `, [id]);
                
                // Luego eliminamos los pedidos del cliente y guardamos sus IDs
                const deletePedidosResult = await client.query(
                    'DELETE FROM pedidos WHERE cliente_id = $1 RETURNING id',
                    [id]
                );
                
                pedidosEliminadosIds = deletePedidosResult.rows.map(row => row.id);
                console.log(`Eliminados ${deletePedidosResult.rowCount} pedidos del cliente ${id}`, pedidosEliminadosIds);
            } else {
                // Verificamos si tiene pedidos activos
                const pedidosCheck = await client.query(
                    `SELECT COUNT(*) as count FROM pedidos 
                     WHERE cliente_id = $1 AND etapa_actual NOT IN ('COMPLETADO', 'ARCHIVADO', 'CANCELADO')`,
                    [id]
                );
                
                if (parseInt(pedidosCheck.rows[0].count) > 0) {
                    throw new Error('No se puede eliminar el cliente porque tiene pedidos activos. Elimínelo con sus pedidos o archívelo.');
                }
                
                // Desvinculamos los pedidos históricos del cliente
                await client.query(
                    'UPDATE pedidos SET cliente_id = NULL WHERE cliente_id = $1',
                    [id]
                );
            }
            
            // Finalmente, eliminamos el cliente
            const deleteResult = await client.query(
                'DELETE FROM clientes WHERE id = $1 RETURNING *',
                [id]
            );
            
            if (deleteResult.rows.length === 0) {
                throw new Error('Cliente no encontrado');
            }
            
            await client.query('COMMIT');
            
            return {
                cliente: deleteResult.rows[0],
                pedidosEliminados: deletePedidos,
                pedidosEliminadosIds: pedidosEliminadosIds
            };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error al eliminar cliente permanentemente:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // === MÉTODOS PARA VENDEDORES ===

    async getAllVendedores() {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM vendedores ORDER BY nombre ASC';
            const result = await client.query(query);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async getVendedorById(id) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM vendedores WHERE id = $1';
            const result = await client.query(query, [id]);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    async createVendedor(vendedorData) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO vendedores (nombre, email, telefono, activo)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const values = [
                vendedorData.nombre,
                vendedorData.email || null,
                vendedorData.telefono || null,
                vendedorData.activo !== undefined ? vendedorData.activo : true
            ];
            
            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async updateVendedor(id, vendedorData) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const setParts = [];
            const values = [];
            let valueIndex = 1;

            const validFields = ['nombre', 'email', 'telefono', 'activo'];
            validFields.forEach(field => {
                if (vendedorData[field] !== undefined) {
                    setParts.push(`${field} = $${valueIndex++}`);
                    values.push(vendedorData[field]);
                }
            });

            if (setParts.length === 0) {
                return this.getVendedorById(id);
            }

            values.push(id);
            const query = `
                UPDATE vendedores
                SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${valueIndex}
                RETURNING *;
            `;

            const result = await client.query(query, values);
            if (result.rowCount === 0) throw new Error(`Vendedor con ID ${id} no encontrado.`);
            
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async deleteVendedor(id) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = 'DELETE FROM vendedores WHERE id = $1';
            await client.query(query, [id]);
        } finally {
            client.release();
        }
    }

    async getVendedorPedidos(vendedorId, estado = null) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            let whereClause = "WHERE (vendedor_id = $1 OR data->>'vendedorId' = $1::text)";
            const queryParams = [vendedorId];

            // Filtrar por estado de pedido
            if (estado === 'activo') {
                whereClause += ` AND etapa_actual NOT IN ('COMPLETADO', 'ARCHIVADO')`;
            } else if (estado === 'completado') {
                whereClause += ` AND etapa_actual = 'COMPLETADO'`;
            } else if (estado === 'archivado') {
                whereClause += ` AND etapa_actual = 'ARCHIVADO'`;
            } else if (estado === 'preparacion') {
                // Solo pedidos en PREPARACION y PENDIENTE
                whereClause += ` AND etapa_actual IN ('PREPARACION', 'PENDIENTE')`;
            } else if (estado === 'produccion') {
                // Solo pedidos en IMPRESION_* y POST_* (excluyendo PREPARACION y PENDIENTE)
                whereClause += ` AND etapa_actual IN (
                    'IMPRESION_WM1', 'IMPRESION_GIAVE', 'IMPRESION_WM3', 'IMPRESION_ANON',
                    'POST_LAMINACION_SL2', 'POST_LAMINACION_NEXUS',
                    'POST_REBOBINADO_S2DT', 'POST_REBOBINADO_PROSLIT',
                    'POST_PERFORACION_MIC', 'POST_PERFORACION_MAC', 'POST_REBOBINADO_TEMAC'
                )`;
            }

            const query = `
                SELECT 
                    id,
                    data,
                    etapa_actual,
                    fecha_pedido,
                    fecha_entrega,
                    created_at,
                    updated_at
                FROM pedidos
                ${whereClause}
                ORDER BY created_at DESC
            `;

            const result = await client.query(query, queryParams);
            
            // Transformar los pedidos para que tengan el formato esperado
            const pedidos = result.rows.map(row => {
                const pedidoData = row.data || {};
                return {
                    id: row.id,
                    ...pedidoData,
                    etapaActual: row.etapa_actual,
                    fechaCreacion: pedidoData.fechaCreacion || row.fecha_pedido || row.created_at,
                    fechaEntrega: pedidoData.fechaEntrega || row.fecha_entrega || null,
                    fechaActualizacion: row.updated_at,
                };
            });

            return pedidos;
        } finally {
            client.release();
        }
    }

    async getVendedorEstadisticas(vendedorId) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT 
                    COUNT(*) FILTER (WHERE etapa_actual IN (
                        'PREPARACION', 'PENDIENTE',
                        'IMPRESION_WM1', 'IMPRESION_GIAVE', 'IMPRESION_WM3', 'IMPRESION_ANON',
                        'POST_LAMINACION_SL2', 'POST_LAMINACION_NEXUS',
                        'POST_REBOBINADO_S2DT', 'POST_REBOBINADO_PROSLIT',
                        'POST_PERFORACION_MIC', 'POST_PERFORACION_MAC', 'POST_REBOBINADO_TEMAC'
                    )) as pedidos_en_produccion,
                    COUNT(*) FILTER (WHERE etapa_actual NOT IN ('COMPLETADO', 'ARCHIVADO', 'CANCELADO')) as pedidos_activos,
                    COUNT(*) FILTER (WHERE etapa_actual = 'COMPLETADO') as pedidos_completados,
                    COUNT(*) FILTER (WHERE etapa_actual = 'ARCHIVADO') as pedidos_archivados,
                    COUNT(*) as total_pedidos,
                    SUM((data->>'metros')::numeric) FILTER (WHERE etapa_actual = 'COMPLETADO') as metros_producidos,
                    MAX(COALESCE(fecha_pedido, created_at)) as ultimo_pedido_fecha
                FROM pedidos
                WHERE vendedor_id = $1 OR data->>'vendedorId' = $1::text
            `;

            const result = await client.query(query, [vendedorId]);
            return result.rows[0] || {
                pedidos_en_produccion: 0,
                pedidos_activos: 0,
                pedidos_completados: 0,
                pedidos_archivados: 0,
                total_pedidos: 0,
                metros_producidos: 0,
                ultimo_pedido_fecha: null
            };
        } finally {
            client.release();
        }
    }

    // === MÉTODOS DE AUDITORÍA (LEGACY) ===

    async getAuditLog(limit = 100) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT id, timestamp, user_role as "userRole", action, pedido_id as "pedidoId", details
                FROM audit_log
                ORDER BY timestamp DESC
                LIMIT $1;
            `;
            const result = await client.query(query, [limit]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async logAuditAction(userRole, action, pedidoId = null, details = null) {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO audit_log (user_role, action, pedido_id, details)
                VALUES ($1, $2, $3, $4)
                RETURNING id, timestamp, user_role as "userRole", action, pedido_id as "pedidoId", details;
            `;
            const values = [userRole, action, pedidoId, details ? JSON.stringify(details) : null];
            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // === MÉTODOS DE INTEGRIDAD DE DATOS ===

    async runDataIntegrityChecks() {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            const results = {};

            const [pedidosSinClienteId, pedidosConClienteIdInvalido, clientesDuplicadosCif, clientesDuplicadosNombre] = await Promise.all([
                client.query(`
                    SELECT id, cliente, numero_pedido_cliente
                    FROM pedidos
                    WHERE cliente_id IS NULL;
                `),
                client.query(`
                    SELECT p.id, p.cliente_id, p.cliente
                    FROM pedidos p
                    LEFT JOIN clientes c ON p.cliente_id = c.id
                    WHERE p.cliente_id IS NOT NULL AND c.id IS NULL;
                `),
                client.query(`
                    SELECT cif, COUNT(*) as count, ARRAY_AGG(id) as ids, ARRAY_AGG(nombre) as nombres
                    FROM clientes
                    WHERE cif IS NOT NULL AND cif != ''
                    GROUP BY cif
                    HAVING COUNT(*) > 1;
                `),
                client.query(`
                    SELECT nombre, COUNT(*) as count, ARRAY_AGG(id) as ids
                    FROM clientes
                    GROUP BY nombre
                    HAVING COUNT(*) > 1;
                `)
            ]);

            results.pedidos_sin_cliente_id = {
                count: pedidosSinClienteId.rowCount,
                items: pedidosSinClienteId.rows,
            };
            results.pedidos_con_cliente_id_invalido = {
                count: pedidosConClienteIdInvalido.rowCount,
                items: pedidosConClienteIdInvalido.rows,
            };
            results.clientes_duplicados_cif = {
                count: clientesDuplicadosCif.rowCount,
                items: clientesDuplicadosCif.rows,
            };
            results.clientes_duplicados_nombre = {
                count: clientesDuplicadosNombre.rowCount,
                items: clientesDuplicadosNombre.rows,
            };

            return results;
        } finally {
            client.release();
        }
    }

    async fixMissingClientIds() {
        if (!this.isInitialized) throw new Error('Database not initialized');
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            // Intenta matchear por nombre de cliente exacto
            const updateResult = await client.query(`
                UPDATE pedidos p
                SET cliente_id = c.id
                FROM clientes c
                WHERE p.cliente_id IS NULL AND p.cliente = c.nombre;
            `);
            
            await client.query('COMMIT');
            return { updatedCount: updateResult.rowCount };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async hasPermission(userId, permissionId, userFromRequest = null) {
        try {
            console.log(`🔍 Verificando permiso '${permissionId}' para usuario ID: ${userId}`);
            
            const userRole = userFromRequest?.role || 'OPERATOR';
            if (userRole === 'Administrador' || userRole === 'ADMIN') {
                console.log(`👑 Usuario administrador - TODOS LOS PERMISOS CONCEDIDOS`);
                return true;
            }
            
            if (!this.isInitialized) {
                console.log(`🔧 BD no disponible, usando permisos del frontend en modo desarrollo`);
                
                if (userFromRequest && userFromRequest.permissions && Array.isArray(userFromRequest.permissions)) {
                    const userPermission = userFromRequest.permissions.find(perm => perm.id === permissionId);
                    const hasPermission = userPermission ? userPermission.enabled : false;
                    
                    console.log(`✅ Permiso '${permissionId}' ${hasPermission ? 'PERMITIDO' : 'DENEGADO'} según permisos del frontend`);
                    return hasPermission;
                }
                
                const rolePermissions = this.getDefaultPermissionsForRole(userRole);
                const hasPermission = rolePermissions.some(perm => 
                    perm.permissionId === permissionId && perm.enabled
                );
                
                console.log(`✅ Permiso '${permissionId}' ${hasPermission ? 'PERMITIDO' : 'DENEGADO'} según rol ${userRole} en modo desarrollo`);
                return hasPermission;
            }
            
            let user = await this.getAdminUserById(userId);
            
            if (!user) {
                let legacyUser = await this.findLegacyUserById(userId);
                
                if (legacyUser) {
                    console.log(`👤 Usuario legacy encontrado: ${legacyUser.username}, rol: ${legacyUser.role}`);
                    
                    if (legacyUser.role === 'ADMIN' || legacyUser.role === 'Administrador') {
                        console.log(`👑 Usuario administrador legacy - TODOS LOS PERMISOS CONCEDIDOS`);
                        return true;
                    }
                    
                    const defaultPermissions = this.getDefaultPermissionsForRole(legacyUser.role);
                    const hasPermission = defaultPermissions.some(perm => 
                        perm.permissionId === permissionId && perm.enabled
                    );
                    
                    console.log(`✅ Permiso '${permissionId}' ${hasPermission ? 'PERMITIDO' : 'DENEGADO'} para usuario legacy`);
                    return hasPermission;
                }
                
                console.log(`⚠️ Usuario ${userId} no encontrado, asignando permisos de administrador por seguridad`);
                const fallbackPermissions = this.getDefaultPermissionsForRole('ADMIN');
                const hasPermission = fallbackPermissions.some(perm => 
                    perm.permissionId === permissionId && perm.enabled
                );
                
                console.log(`✅ Permiso '${permissionId}' ${hasPermission ? 'PERMITIDO' : 'DENEGADO'} por fallback`);
                return hasPermission;
            }
            
            console.log(`👤 Usuario encontrado: ${user.username}, rol: ${user.role}`);
            
            if (user.role === 'ADMIN' || user.role === 'Administrador') {
                console.log(`👑 Usuario administrador con BD - TODOS LOS PERMISOS CONCEDIDOS`);
                return true;
            }
            
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
            
            if (isValidUUID && this.isInitialized) {
                try {
                    const result = await this.pool.query(
                        'SELECT enabled FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
                        [userId, permissionId]
                    );
                    
                    if (result.rows.length > 0) {
                        const hasPermission = result.rows[0].enabled;
                        console.log(`✅ Permiso específico encontrado en BD: ${hasPermission ? 'PERMITIDO' : 'DENEGADO'}`);
                        return hasPermission;
                    }
                } catch (queryError) {
                    console.log(`⚠️ Error consultando user_permissions: ${queryError.message}`);
                }
            }
            
            console.log(`🔧 Usando permisos por defecto para rol: ${user.role}`);
            const defaultPermissions = this.getDefaultPermissionsForRole(user.role);
            const hasPermission = defaultPermissions.some(perm => 
                perm.permissionId === permissionId && perm.enabled
            );
            
            console.log(`✅ Permiso '${permissionId}' ${hasPermission ? 'PERMITIDO' : 'DENEGADO'} por defecto`);
            return hasPermission;
            
        } catch (error) {
            console.error('Error verificando permiso:', error);
            console.log(`🔧 Error en verificación de permisos, permitiendo acceso por seguridad`);
            return true;
        }
    }

    getDefaultPermissionsForRole(role) {
        const allPermissions = [
            'pedidos.create', 'pedidos.view', 'pedidos.edit', 'pedidos.delete',
            'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.delete',
            'usuarios.admin', 'usuarios.view', 'usuarios.create', 'usuarios.delete', 
            'reportes.view', 'reportes.export', 'datos.import',
            'configuracion.admin', 'configuracion.view',
            'permisos.admin', 'auditoria.view',
            'secuencias.admin', 'secuencias.edit',
            'pedidos.process', 'pedidos.complete', 'pedidos.cancel',
            'dashboard.view', 'inventario.admin', 'inventario.view',
            'notificaciones.admin', 'notificaciones.view',
            'backup.admin', 'restore.admin',
            'antivaho.admin', 'antivaho.view'
        ];

        const defaultPermissions = [];

        switch (role) {
            case 'ADMIN':
            case 'Administrador':
                allPermissions.forEach(permission => {
                    defaultPermissions.push({ permissionId: permission, enabled: true });
                });
                break;
            case 'SUPERVISOR':
            case 'Supervisor':
                const supervisorPermissions = allPermissions.filter(p => 
                    !['usuarios.delete', 'backup.admin', 'restore.admin', 'permisos.admin'].includes(p)
                );
                supervisorPermissions.forEach(permission => {
                    defaultPermissions.push({ permissionId: permission, enabled: true });
                });
                break;
            case 'OPERATOR':
            case 'Operador':
                const operatorPermissions = [
                    'pedidos.create', 'pedidos.view', 'pedidos.edit',
                    'pedidos.process', 'pedidos.complete',
                    'dashboard.view', 'inventario.view',
                    'antivaho.admin', 'antivaho.view',
                    'secuencias.admin', 'secuencias.edit'
                ];
                operatorPermissions.forEach(permission => {
                    defaultPermissions.push({ permissionId: permission, enabled: true });
                });
                break;
            case 'VIEWER':
            case 'Visualizador':
                const viewerPermissions = [
                    'pedidos.view', 'dashboard.view', 'inventario.view',
                    'reportes.view', 'antivaho.view', 'clientes.view'
                ];
                viewerPermissions.forEach(permission => {
                    defaultPermissions.push({ permissionId: permission, enabled: true });
                });
                break;
            default:
                const defaultOps = ['pedidos.view', 'dashboard.view'];
                defaultOps.forEach(permission => {
                    defaultPermissions.push({ permissionId: permission, enabled: true });
                });
                break;
        }

        console.log(`🔧 Permisos por defecto para rol ${role}:`, defaultPermissions.length, 'permisos');
        return defaultPermissions;
    }

    // === MÉTODO DE CIERRE ===
    async close() {
        if (this.pool) {
            console.log('🔄 Cerrando conexiones a PostgreSQL...');
            await this.pool.end();
            this.pool = null;
            this.isInitialized = false;
            console.log('✅ Conexiones a PostgreSQL cerradas');
        }
    }
}

module.exports = PostgreSQLClient;
