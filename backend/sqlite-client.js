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
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS pedidos (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.run(createTableSQL, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                    reject(err);
                    return;
                }
                console.log('SQLite tables created/verified successfully');
                resolve();
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
