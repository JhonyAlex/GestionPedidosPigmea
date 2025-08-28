const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class SQLiteClient {
    constructor() {
        // Asegurarse de que el directorio data existe
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        this.dbPath = path.join(dataDir, 'pedidos.db');
        this.db = null;
        this.isInitialized = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening SQLite database:', err);
                    reject(err);
                    return;
                }
                
                console.log(`SQLite database connected at ${this.dbPath}`);
                this.createTables().then(() => {
                    this.isInitialized = true;
                    resolve();
                }).catch(reject);
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const createPedidosTableSQL = `
                CREATE TABLE IF NOT EXISTS pedidos (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createUsersTableSQL = `
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'Operador',
                    display_name TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME
                )
            `;

            // Crear tabla de pedidos primero
            this.db.run(createPedidosTableSQL, (err) => {
                if (err) {
                    console.error('Error creating pedidos table:', err);
                    reject(err);
                    return;
                }

                // Luego crear tabla de usuarios
                this.db.run(createUsersTableSQL, (err) => {
                    if (err) {
                        console.error('Error creating users table:', err);
                        reject(err);
                        return;
                    }

                    console.log('SQLite tables created/verified successfully');
                    resolve();
                });
            });
        });
    }

    async create(pedido) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO pedidos (id, data, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `);
            
            stmt.run([pedido.id, JSON.stringify(pedido)], function(err) {
                if (err) {
                    console.error('Error creating pedido:', err);
                    reject(err);
                    return;
                }
                resolve(pedido);
            });
            
            stmt.finalize();
        });
    }

    async update(pedido) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE pedidos 
                SET data = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `);
            
            stmt.run([JSON.stringify(pedido), pedido.id], function(err) {
                if (err) {
                    console.error('Error updating pedido:', err);
                    reject(err);
                    return;
                }
                
                if (this.changes === 0) {
                    reject(new Error('Pedido not found'));
                    return;
                }
                
                resolve(pedido);
            });
            
            stmt.finalize();
        });
    }

    async delete(id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('DELETE FROM pedidos WHERE id = ?');
            
            stmt.run([id], function(err) {
                if (err) {
                    console.error('Error deleting pedido:', err);
                    reject(err);
                    return;
                }
                
                if (this.changes === 0) {
                    reject(new Error('Pedido not found'));
                    return;
                }
                
                resolve();
            });
            
            stmt.finalize();
        });
    }

    async findById(id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT data FROM pedidos WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error('Error finding pedido:', err);
                        reject(err);
                        return;
                    }
                    
                    if (row) {
                        resolve(JSON.parse(row.data));
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }

    async getAll() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT data FROM pedidos ORDER BY updated_at DESC',
                [],
                (err, rows) => {
                    if (err) {
                        console.error('Error getting all pedidos:', err);
                        reject(err);
                        return;
                    }
                    
                    const pedidos = rows.map(row => JSON.parse(row.data));
                    resolve(pedidos);
                }
            );
        });
    }

    async clear() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM pedidos', (err) => {
                if (err) {
                    console.error('Error clearing pedidos:', err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    async bulkInsert(pedidos) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                const stmt = this.db.prepare(`
                    INSERT OR REPLACE INTO pedidos (id, data, updated_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                `);
                
                let errors = [];
                let completed = 0;
                
                pedidos.forEach((pedido, index) => {
                    stmt.run([pedido.id, JSON.stringify(pedido)], (err) => {
                        if (err) {
                            errors.push(`Error inserting pedido ${pedido.id}: ${err.message}`);
                        }
                        
                        completed++;
                        
                        if (completed === pedidos.length) {
                            stmt.finalize();
                            
                            if (errors.length > 0) {
                                this.db.run('ROLLBACK');
                                reject(new Error(`Bulk insert failed: ${errors.join(', ')}`));
                            } else {
                                this.db.run('COMMIT', (err) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                });
                            }
                        }
                    });
                });
            });
        });
    }

    // === MÉTODOS PARA USUARIOS ===
    
    async createUser(user) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const { id, username, password, role = 'Operador', displayName } = user;
            
            const sql = `
                INSERT INTO users (id, username, password, role, display_name, created_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            
            this.db.run(sql, [id, username, password, role, displayName], function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        reject(new Error('El nombre de usuario ya existe'));
                    } else {
                        console.error('Error creating user:', err);
                        reject(err);
                    }
                    return;
                }
                
                console.log(`Usuario creado: ${username} (${role})`);
                resolve({ id, username, role, displayName });
            });
        });
    }

    async findUserByUsername(username) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE username = ?';
            
            this.db.get(sql, [username], (err, row) => {
                if (err) {
                    console.error('Error finding user:', err);
                    reject(err);
                    return;
                }
                
                if (!row) {
                    resolve(null);
                    return;
                }
                
                resolve({
                    id: row.id,
                    username: row.username,
                    password: row.password,
                    role: row.role,
                    displayName: row.display_name,
                    createdAt: row.created_at,
                    lastLogin: row.last_login
                });
            });
        });
    }

    async updateUserLastLogin(username) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?';
            
            this.db.run(sql, [username], function(err) {
                if (err) {
                    console.error('Error updating last login:', err);
                    reject(err);
                    return;
                }
                
                resolve();
            });
        });
    }

    async getAllUsers() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, username, role, display_name, created_at, last_login FROM users ORDER BY created_at DESC';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error getting users:', err);
                    reject(err);
                    return;
                }
                
                const users = rows.map(row => ({
                    id: row.id,
                    username: row.username,
                    role: row.role,
                    displayName: row.display_name,
                    createdAt: row.created_at,
                    lastLogin: row.last_login
                }));
                
                resolve(users);
            });
        });
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('SQLite database closed');
                    }
                    resolve();
                });
            });
        }
    }
}

module.exports = SQLiteClient;
