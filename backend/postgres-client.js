const { Pool } = require('pg');

class PostgreSQLClient {
    constructor() {
        this.pool = null;
        this.isInitialized = false;
        
        // Priorizar variables individuales para mejor control y logging
        if (process.env.DB_HOST || process.env.POSTGRES_HOST) {
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
        } else if (process.env.DATABASE_URL) {
            this.config = {
                connectionString: process.env.DATABASE_URL,
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

            // Tabla de pedidos
            await client.query(`
                CREATE TABLE IF NOT EXISTS pedidos (
                    id VARCHAR(255) PRIMARY KEY,
                    numero_pedido_cliente VARCHAR(255),
                    cliente VARCHAR(255),
                    fecha_pedido TIMESTAMP,
                    fecha_entrega TIMESTAMP,
                    etapa_actual VARCHAR(100),
                    prioridad VARCHAR(50),
                    secuencia_pedido INTEGER,
                    cantidad_piezas INTEGER,
                    observaciones TEXT,
                    datos_tecnicos JSONB,
                    antivaho BOOLEAN DEFAULT false,
                    camisa VARCHAR(100),
                    data JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

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

    async createTables() {
        const client = await this.pool.connect();
        
        try {
            console.log('🔧 Iniciando creación/verificación de tablas...');

            // Tabla de pedidos
            await client.query(`
                CREATE TABLE IF NOT EXISTS pedidos (
                    id VARCHAR(255) PRIMARY KEY,
                    numero_pedido_cliente VARCHAR(255),
                    cliente VARCHAR(255),
                    fecha_pedido TIMESTAMP,
                    fecha_entrega TIMESTAMP,
                    etapa_actual VARCHAR(100),
                    prioridad VARCHAR(50),
                    secuencia_pedido INTEGER,
                    cantidad_piezas INTEGER,
                    observaciones TEXT,
                    datos_tecnicos JSONB,
                    antivaho BOOLEAN DEFAULT false,
                    camisa VARCHAR(100),
                    data JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Tabla pedidos verificada');

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

            // Crear extensión para UUID si no existe
            await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
            console.log('✅ Extensión uuid-ossp verificada');

            // Tabla de usuarios administrativos (debe crearse ANTES que audit_logs)
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

            // Índices para mejorar performance
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_pedidos_etapa ON pedidos(etapa_actual);
                CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente);
                CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega ON pedidos(fecha_entrega);
                CREATE INDEX IF NOT EXISTS idx_pedidos_secuencia ON pedidos(secuencia_pedido);
                CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
                CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
                CREATE INDEX IF NOT EXISTS idx_audit_user_role ON audit_log(user_role);
                CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
                CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
                CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
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
            console.log('✅ Triggers configurados');

            console.log('🎉 Todas las tablas han sido verificadas/creadas exitosamente');

            
        } finally {
            client.release();
        }
    }

    // === MÉTODOS PARA PEDIDOS ===

    async create(pedido) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const query = `
                INSERT INTO pedidos (
                    id, numero_pedido_cliente, cliente, fecha_pedido, fecha_entrega,
                    etapa_actual, prioridad, secuencia_pedido, cantidad_piezas,
                    observaciones, datos_tecnicos, antivaho, camisa, data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *;
            `;
            
            const values = [
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
                JSON.stringify(pedido)
            ];

            const result = await client.query(query, values);
            return pedido;
            
        } finally {
            client.release();
        }
    }

    async update(pedido) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const query = `
                UPDATE pedidos SET 
                    numero_pedido_cliente = $2,
                    cliente = $3,
                    fecha_pedido = $4,
                    fecha_entrega = $5,
                    etapa_actual = $6,
                    prioridad = $7,
                    secuencia_pedido = $8,
                    cantidad_piezas = $9,
                    observaciones = $10,
                    datos_tecnicos = $11,
                    antivaho = $12,
                    camisa = $13,
                    data = $14
                WHERE id = $1
                RETURNING *;
            `;
            
            const values = [
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
                JSON.stringify(pedido)
            ];

            const result = await client.query(query, values);
            
            if (result.rowCount === 0) {
                throw new Error(`Pedido ${pedido.id} no encontrado para actualizar`);
            }
            
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

    // === MÉTODOS PARA USUARIOS ===

    async createUser(user) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const query = `
                INSERT INTO users (id, username, password, role, display_name)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, username, role, display_name, created_at;
            `;
            
            const values = [
                user.id,
                user.username,
                user.password,
                user.role,
                user.displayName
            ];

            const result = await client.query(query, values);
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }

    async findUserByUsername(username) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM users WHERE username = $1', 
                [username]
            );
            
            return result.rows.length > 0 ? result.rows[0] : null;
            
        } finally {
            client.release();
        }
    }

    async updateUserLastLogin(username) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            await client.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = $1',
                [username]
            );
            
        } finally {
            client.release();
        }
    }

    async getAllUsers() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT id, username, role, display_name, created_at, last_login FROM users ORDER BY created_at DESC'
            );
            
            return result.rows;
            
        } finally {
            client.release();
        }
    }

    async findUserById(userId) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM users WHERE id = $1',
                [userId]
            );
            
            return result.rows.length > 0 ? result.rows[0] : null;
            
        } finally {
            client.release();
        }
    }

    async updateUser(userId, updateData) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const setClauses = [];
            const values = [];
            let paramIndex = 1;

            if (updateData.username) {
                setClauses.push(`username = $${paramIndex}`);
                values.push(updateData.username);
                paramIndex++;
            }

            if (updateData.role) {
                setClauses.push(`role = $${paramIndex}`);
                values.push(updateData.role);
                paramIndex++;
            }

            if (updateData.displayName) {
                setClauses.push(`display_name = $${paramIndex}`);
                values.push(updateData.displayName);
                paramIndex++;
            }

            if (updateData.password) {
                setClauses.push(`password = $${paramIndex}`);
                values.push(updateData.password);
                paramIndex++;
            }

            if (setClauses.length === 0) {
                throw new Error('No data to update');
            }

            values.push(userId);
            const query = `
                UPDATE users 
                SET ${setClauses.join(', ')} 
                WHERE id = $${paramIndex}
                RETURNING id, username, role, display_name, created_at
            `;

            const result = await client.query(query, values);
            
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }

    async deleteUser(userId) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const result = await client.query(
                'DELETE FROM users WHERE id = $1 RETURNING id',
                [userId]
            );
            
            return result.rows.length > 0;
            
        } finally {
            client.release();
        }
    }

    // === UTILIDADES ===

    // Métodos de auditoría
    async logAuditAction(userRole, action, pedidoId = null, details = null) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(
                'INSERT INTO audit_log (user_role, action, pedido_id, details) VALUES ($1, $2, $3, $4) RETURNING *',
                [userRole, action, pedidoId, details]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async getAuditLog(limit = 100) {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT $1',
                [limit]
            );
            return result.rows.map(row => ({
                id: row.id,
                timestamp: row.timestamp.toISOString(),
                userRole: row.user_role,
                action: row.action,
                pedidoId: row.pedido_id,
                details: row.details
            }));
        } finally {
            client.release();
        }
    }

    async getStats() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        const client = await this.pool.connect();
        
        try {
            const pedidosCount = await client.query('SELECT COUNT(*) as count FROM pedidos');
            const usersCount = await client.query('SELECT COUNT(*) as count FROM users');
            const etapasStats = await client.query(`
                SELECT etapa_actual, COUNT(*) as count 
                FROM pedidos 
                GROUP BY etapa_actual 
                ORDER BY count DESC
            `);
            
            return {
                totalPedidos: parseInt(pedidosCount.rows[0].count),
                totalUsuarios: parseInt(usersCount.rows[0].count),
                pedidosPorEtapa: etapasStats.rows
            };
            
        } finally {
            client.release();
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }

    // =================================================================
    // FUNCIONES ADMINISTRATIVAS
    // =================================================================

    // --- GESTIÓN DE USUARIOS ADMINISTRATIVOS ---

    async getAdminUserByUsername(username) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM public.admin_users WHERE username = $1',
                [username]
            );
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    async getAdminUserByEmail(email) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM admin_users WHERE email = $1',
                [email]
            );
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    async getAdminUserById(id) {
        // Verificar que el pool esté disponible
        if (!this.pool || !this.isInitialized) {
            console.log('⚠️ Pool de conexiones no disponible para getAdminUserById');
            return null;
        }
        
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM admin_users WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    async getAllAdminUsers() {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM admin_users ORDER BY created_at DESC'
            );
            return result.rows;
        } finally {
            client.release();
        }
    }

    async createAdminUser(userData) {
        const client = await this.pool.connect();
        try {
            const {
                username,
                email = `${username}@pigmea.local`,
                firstName = username,
                lastName = '',
                role,
                passwordHash,
                permissions = [],
                isActive = true
            } = userData;

            // Verificar qué columnas existen en la tabla
            const columnsResult = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'admin_users' 
                AND table_schema = 'public'
            `);
            
            const existingColumns = columnsResult.rows.map(row => row.column_name);

            // Construir query dinámicamente basado en columnas existentes
            const columns = ['username'];
            const values = [username];
            const placeholders = ['$1'];
            let paramIndex = 2;

            if (existingColumns.includes('email')) {
                columns.push('email');
                values.push(email);
                placeholders.push(`$${paramIndex++}`);
            }

            if (existingColumns.includes('first_name')) {
                columns.push('first_name');
                values.push(firstName);
                placeholders.push(`$${paramIndex++}`);
            }

            if (existingColumns.includes('last_name')) {
                columns.push('last_name');
                values.push(lastName);
                placeholders.push(`$${paramIndex++}`);
            }

            if (existingColumns.includes('password_hash')) {
                columns.push('password_hash');
                values.push(passwordHash);
                placeholders.push(`$${paramIndex++}`);
            }

            if (existingColumns.includes('role')) {
                columns.push('role');
                values.push(role);
                placeholders.push(`$${paramIndex++}`);
            }

            if (existingColumns.includes('permissions')) {
                columns.push('permissions');
                values.push(JSON.stringify(permissions));
                placeholders.push(`$${paramIndex++}`);
            }

            if (existingColumns.includes('is_active')) {
                columns.push('is_active');
                values.push(isActive);
                placeholders.push(`$${paramIndex++}`);
            }

            const query = `
                INSERT INTO admin_users (${columns.join(', ')})
                VALUES (${placeholders.join(', ')})
                RETURNING *
            `;

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async updateAdminUser(id, updateData) {
        const client = await this.pool.connect();
        try {
            const setParts = [];
            const values = [];
            let valueIndex = 1;

            if (updateData.username !== undefined) {
                setParts.push(`username = $${valueIndex++}`);
                values.push(updateData.username);
            }
            if (updateData.email !== undefined) {
                setParts.push(`email = $${valueIndex++}`);
                values.push(updateData.email);
            }
            if (updateData.firstName !== undefined) {
                setParts.push(`first_name = $${valueIndex++}`);
                values.push(updateData.firstName);
            }
            if (updateData.lastName !== undefined) {
                setParts.push(`last_name = $${valueIndex++}`);
                values.push(updateData.lastName);
            }
            if (updateData.displayName !== undefined) {
                // Mapear displayName a first_name y last_name si no están definidos por separado
                const names = updateData.displayName.split(' ');
                if (!updateData.firstName && !updateData.lastName) {
                    setParts.push(`first_name = $${valueIndex++}`);
                    values.push(names[0] || '');
                    setParts.push(`last_name = $${valueIndex++}`);
                    values.push(names.slice(1).join(' ') || '');
                }
            }
            if (updateData.passwordHash !== undefined) {
                setParts.push(`password_hash = $${valueIndex++}`);
                values.push(updateData.passwordHash);
            }
            if (updateData.role !== undefined) {
                setParts.push(`role = $${valueIndex++}`);
                values.push(updateData.role);
            }
            if (updateData.isActive !== undefined) {
                setParts.push(`is_active = $${valueIndex++}`);
                values.push(updateData.isActive);
            }
            if (updateData.permissions !== undefined) {
                setParts.push(`permissions = $${valueIndex++}`);
                values.push(JSON.stringify(updateData.permissions));
            }

            setParts.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);

            const query = `
                UPDATE admin_users 
                SET ${setParts.join(', ')}
                WHERE id = $${valueIndex}
                RETURNING *
            `;

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async deleteAdminUser(id) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM admin_users WHERE id = $1', [id]);
            return true;
        } finally {
            client.release();
        }
    }

    async updateUserLastLogin(userId, ipAddress, userAgent) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE admin_users 
                SET last_login_at = CURRENT_TIMESTAMP, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [userId]);
            console.log('✅ Last login actualizado para usuario ID:', userId);
        } finally {
            client.release();
        }
    }

    async updateUserLastActivity(userId, ipAddress, userAgent) {
        // Verificar que el pool esté disponible
        if (!this.pool || !this.isInitialized) {
            console.log('⚠️ Pool de conexiones no disponible para updateUserLastActivity');
            return;
        }
        
        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE admin_users 
                SET last_activity = CURRENT_TIMESTAMP,
                    ip_address = $2,
                    user_agent = $3
                WHERE id = $1
            `, [userId, ipAddress, userAgent]);
        } finally {
            client.release();
        }
    }

    async updateUserPassword(userId, passwordHash) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE admin_users 
                SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [userId, passwordHash]);
        } finally {
            client.release();
        }
    }

    async bulkDeleteAdminUsers(userIds) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'DELETE FROM admin_users WHERE id = ANY($1)',
                [userIds]
            );
            return { deletedCount: result.rowCount };
        } finally {
            client.release();
        }
    }

    async getUserActivity() {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    u.id as user_id,
                    u.username,
                    u.last_activity,
                    COALESCE(daily.actions_today, 0) as actions_today,
                    COALESCE(total.total_actions, 0) as total_actions
                FROM admin_users u
                LEFT JOIN (
                    SELECT user_id, COUNT(*) as actions_today
                    FROM audit_logs 
                    WHERE created_at >= CURRENT_DATE
                    GROUP BY user_id
                ) daily ON u.id = daily.user_id
                LEFT JOIN (
                    SELECT user_id, COUNT(*) as total_actions
                    FROM audit_logs 
                    GROUP BY user_id
                ) total ON u.id = total.user_id
                WHERE u.is_active = true
                ORDER BY u.last_activity DESC NULLS LAST
            `);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // --- GESTIÓN DE AUDITORÍA ---

    async createAuditLog(logData) {
        // Verificar que el pool esté disponible
        if (!this.pool || !this.isInitialized) {
            console.log('⚠️ Pool de conexiones no disponible, saltando log de auditoría');
            return;
        }
        
        const client = await this.pool.connect();
        try {
            const {
                userId,
                username,
                action,
                module,
                details,
                ipAddress,
                userAgent,
                affectedResource
            } = logData;

            await client.query(`
                INSERT INTO audit_logs (
                    user_id, username, action, module, details,
                    ip_address, user_agent, affected_resource
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                userId, username, action, module, details,
                ipAddress, userAgent, affectedResource
            ]);
        } finally {
            client.release();
        }
    }

    async getAuditLogs(page = 1, limit = 50, filters = {}) {
        // Verificar que el pool esté disponible
        if (!this.pool || !this.isInitialized) {
            console.log('⚠️ Pool de conexiones no disponible, devolviendo logs vacíos');
            return { logs: [], total: 0, page, limit };
        }
        
        const client = await this.pool.connect();
        try {
            const offset = (page - 1) * limit;
            const conditions = [];
            const values = [];
            let valueIndex = 1;

            if (filters.userId) {
                conditions.push(`user_id = $${valueIndex++}`);
                values.push(filters.userId);
            }
            if (filters.action) {
                conditions.push(`action ILIKE $${valueIndex++}`);
                values.push(`%${filters.action}%`);
            }
            if (filters.module) {
                conditions.push(`module = $${valueIndex++}`);
                values.push(filters.module);
            }
            if (filters.startDate) {
                conditions.push(`created_at >= $${valueIndex++}`);
                values.push(filters.startDate);
            }
            if (filters.endDate) {
                conditions.push(`created_at <= $${valueIndex++}`);
                values.push(filters.endDate);
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Consulta para obtener logs
            const logsQuery = `
                SELECT * FROM audit_logs 
                ${whereClause}
                ORDER BY created_at DESC 
                LIMIT $${valueIndex++} OFFSET $${valueIndex++}
            `;
            values.push(limit, offset);

            // Consulta para obtener total
            const countQuery = `
                SELECT COUNT(*) as total FROM audit_logs ${whereClause}
            `;

            const [logsResult, countResult] = await Promise.all([
                client.query(logsQuery, values.slice(0, -2)), // Sin limit y offset para count
                client.query(countQuery, values.slice(0, -2))
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            return {
                logs: logsResult.rows,
                total,
                page,
                totalPages,
                limit
            };
        } finally {
            client.release();
        }
    }

    async getRecentAuditLogs(limit = 10) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM audit_logs 
                ORDER BY created_at DESC 
                LIMIT $1
            `, [limit]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // --- CONFIGURACIÓN DEL SISTEMA ---

    async getSystemConfig() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM system_config ORDER BY category, config_key');
            return result.rows;
        } finally {
            client.release();
        }
    }

    async getSystemConfigByKey(key) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM system_config WHERE config_key = $1', [key]);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    async updateSystemConfig(key, value, updatedBy) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                UPDATE system_config 
                SET config_value = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
                WHERE config_key = $1
                RETURNING *
            `, [key, value, updatedBy]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // --- BACKUPS DE BASE DE DATOS ---

    async createDatabaseBackup(backupData) {
        const client = await this.pool.connect();
        try {
            const {
                filename,
                filePath,
                fileSize,
                backupType,
                createdBy
            } = backupData;

            const result = await client.query(`
                INSERT INTO database_backups (
                    filename, file_path, file_size, backup_type, created_by, status
                ) VALUES ($1, $2, $3, $4, $5, 'in_progress')
                RETURNING *
            `, [filename, filePath, fileSize, backupType, createdBy]);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async updateBackupStatus(backupId, status, errorMessage = null) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                UPDATE database_backups 
                SET status = $2, error_message = $3, completed_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `, [backupId, status, errorMessage]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async getDatabaseBackups() {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT b.*, u.username as created_by_username
                FROM database_backups b
                LEFT JOIN admin_users u ON b.created_by = u.id
                ORDER BY b.created_at DESC
            `);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async deleteDatabaseBackup(backupId) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM database_backups WHERE id = $1', [backupId]);
            return true;
        } finally {
            client.release();
        }
    }

    // --- ESTADÍSTICAS ADMINISTRATIVAS ---

    async getAdminDashboardData() {
        const client = await this.pool.connect();
        try {
            // Estadísticas básicas
            const statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM admin_users) as total_users,
                    (SELECT COUNT(*) FROM admin_users WHERE is_active = true) as active_users,
                    (SELECT COUNT(*) FROM pedidos) as total_pedidos,
                    (SELECT COUNT(*) FROM pedidos WHERE DATE(created_at) = CURRENT_DATE) as pedidos_hoy,
                    (SELECT COUNT(*) FROM pedidos WHERE etapa_actual = 'COMPLETADO') as pedidos_completados,
                    (SELECT COUNT(*) FROM admin_users WHERE last_activity > CURRENT_TIMESTAMP - INTERVAL '30 minutes') as usuarios_conectados,
                    (SELECT COUNT(*) FROM audit_logs WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as sesiones_activas
            `;

            // Tiempo promedio de completado
            const avgTimeQuery = `
                SELECT COALESCE(AVG(
                    EXTRACT(EPOCH FROM (
                        (historial->>-1)::jsonb->>'timestamp'
                    )::timestamp - created_at) / 60
                ), 0) as promedio_tiempo_completado
                FROM pedidos 
                WHERE etapa_actual = 'COMPLETADO' 
                AND jsonb_array_length(historial) > 1
            `;

            const [statsResult, avgTimeResult] = await Promise.all([
                client.query(statsQuery),
                client.query(avgTimeQuery)
            ]);

            const stats = statsResult.rows[0];
            const avgTime = avgTimeResult.rows[0].promedio_tiempo_completado || 0;

            return {
                stats: {
                    totalUsers: parseInt(stats.total_users),
                    activeUsers: parseInt(stats.active_users),
                    totalPedidos: parseInt(stats.total_pedidos),
                    pedidosHoy: parseInt(stats.pedidos_hoy),
                    pedidosCompletados: parseInt(stats.pedidos_completados),
                    promedioTiempoCompletado: Math.round(avgTime),
                    usuariosConectados: parseInt(stats.usuarios_conectados),
                    sesionesActivas: parseInt(stats.sesiones_activas)
                }
            };
        } finally {
            client.release();
        }
    }

    async getSystemHealth() {
        const client = await this.pool.connect();
        try {
            const startTime = Date.now();
            
            // Test de conexión y tiempo de respuesta
            await client.query('SELECT 1');
            const responseTime = Date.now() - startTime;

            // Estadísticas de conexiones
            const connectionStats = await client.query(`
                SELECT 
                    count(*) as total_connections,
                    count(*) filter (where state = 'active') as active_connections
                FROM pg_stat_activity 
                WHERE datname = current_database()
            `);

            const connections = connectionStats.rows[0];

            return {
                database: {
                    status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'warning' : 'error',
                    connections: parseInt(connections.total_connections),
                    responseTime: responseTime
                },
                server: {
                    status: 'healthy',
                    uptime: process.uptime(),
                    cpuUsage: Math.round(process.cpuUsage().user / 1000000), // Aproximación
                    memoryUsage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
                },
                websocket: {
                    status: 'healthy',
                    connections: 0 // Se actualizará desde el servidor WebSocket
                }
            };
        } finally {
            client.release();
        }
    }

    // --- NOTIFICACIONES DEL SISTEMA ---

    async createSystemNotification(notificationData) {
        const client = await this.pool.connect();
        try {
            const {
                title,
                message,
                type,
                targetUsers,
                createdBy,
                expiresAt
            } = notificationData;

            const result = await client.query(`
                INSERT INTO system_notifications (
                    title, message, notification_type, target_users, created_by, expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [title, message, type, JSON.stringify(targetUsers || []), createdBy, expiresAt]);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async getSystemNotifications(userId = null) {
        const client = await this.pool.connect();
        try {
            let query = `
                SELECT * FROM system_notifications 
                WHERE (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                AND is_read = false
            `;
            const values = [];

            if (userId) {
                query += ` AND (target_users = '[]'::jsonb OR target_users ? $1)`;
                values.push(userId);
            }

            query += ` ORDER BY created_at DESC`;

            const result = await client.query(query, values);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Función para verificar y agregar columnas faltantes en admin_users
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

        } catch (error) {
            console.log('⚠️ Error verificando columnas de admin_users:', error.message);
            // No lanzar error - el sistema puede continuar
        }
    }
}

module.exports = PostgreSQLClient;
