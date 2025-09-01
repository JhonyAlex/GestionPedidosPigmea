const { Pool } = require('pg');

class PostgreSQLClient {
    constructor() {
        this.pool = null;
        this.isInitialized = false;
        
        // Priorizar DATABASE_URL si está disponible
        if (process.env.DATABASE_URL) {
            console.log('🔗 Usando DATABASE_URL para conexión');
            this.config = {
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };
        } else {
            console.log('🔗 Usando variables individuales para conexión');
            // Configuración de conexión individual
            this.config = {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME || 'gestion_pedidos',
                user: process.env.DB_USER || 'pigmea_user',
                password: process.env.DB_PASSWORD,
                // Configuraciones adicionales para producción
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 20, // máximo de conexiones en el pool
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };
        }
    }

    async init() {
        try {
            console.log('🔄 Inicializando conexión PostgreSQL...');
            console.log('📋 Configuración de conexión:', {
                host: this.config.host || 'DATABASE_URL',
                port: this.config.port || 'URL',
                database: this.config.database || 'desde DATABASE_URL',
                user: this.config.user || 'desde DATABASE_URL',
                ssl: this.config.ssl
            });

            this.pool = new Pool(this.config);
            
            // Probar la conexión con timeout
            console.log('🔗 Intentando conectar a PostgreSQL...');
            const client = await Promise.race([
                this.pool.connect(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout de conexión (5s)')), 5000)
                )
            ]);
            
            console.log(`🐘 PostgreSQL conectado exitosamente a ${this.config.host || 'DATABASE_URL'}:${this.config.port || 'URL'}`);
            client.release();
            
            // Crear las tablas si no existen
            console.log('📋 Creando/verificando esquema de base de datos...');
            await this.createTables();
            this.isInitialized = true;
            
            console.log('✅ PostgreSQL inicializado correctamente');
        } catch (error) {
            console.error('❌ Error conectando a PostgreSQL:', error.message);
            console.error('🔧 Detalles del error:', error);
            
            // Verificar variables de entorno
            console.log('🔍 Variables de entorno disponibles:');
            console.log('  - DB_HOST:', process.env.DB_HOST || 'NO DEFINIDA');
            console.log('  - DB_PORT:', process.env.DB_PORT || 'NO DEFINIDA');
            console.log('  - DB_NAME:', process.env.DB_NAME || 'NO DEFINIDA');
            console.log('  - DB_USER:', process.env.DB_USER || 'NO DEFINIDA');
            console.log('  - DB_PASSWORD:', process.env.DB_PASSWORD ? '***DEFINIDA***' : 'NO DEFINIDA');
            console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? '***DEFINIDA***' : 'NO DEFINIDA');
            
            throw error;
        }
    }

    async createTables() {
        const client = await this.pool.connect();
        
        try {
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

            // Tabla de usuarios
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

            // Índices para mejorar performance
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_pedidos_etapa ON pedidos(etapa_actual);
                CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente);
                CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega ON pedidos(fecha_entrega);
                CREATE INDEX IF NOT EXISTS idx_pedidos_secuencia ON pedidos(secuencia_pedido);
                CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            `);

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

            console.log('📋 Tablas de PostgreSQL creadas/verificadas exitosamente');
            
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
            console.log(`✅ Pedido creado en PostgreSQL: ${pedido.id}`);
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
            
            console.log(`✅ Pedido actualizado en PostgreSQL: ${pedido.id}`);
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
            
            console.log(`✅ Pedido eliminado de PostgreSQL: ${id}`);
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
            console.log('✅ Todos los pedidos eliminados de PostgreSQL');
            
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
            console.log(`✅ ${pedidos.length} pedidos insertados en lote en PostgreSQL`);
            
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
            console.log(`✅ Usuario creado en PostgreSQL: ${user.username}`);
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

    // === UTILIDADES ===

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
            console.log('🐘 Conexión PostgreSQL cerrada');
        }
    }
}

module.exports = PostgreSQLClient;
