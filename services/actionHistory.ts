import { ActionHistoryEntry } from '../types';

const DB_NAME = 'PigmeaActionHistory';
const DB_VERSION = 1;
const STORE_NAME = 'actions';

class ActionHistoryDB {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Inicializa la base de datos IndexedDB
     */
    async init(): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                console.warn('IndexedDB no disponible');
                resolve();
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Error al abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializada correctamente');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Crear object store si no existe
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    
                    // Crear índices para búsquedas eficientes
                    objectStore.createIndex('contextId', 'contextId', { unique: false });
                    objectStore.createIndex('contextType', 'contextType', { unique: false });
                    objectStore.createIndex('userId', 'userId', { unique: false });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    
                    console.log('✅ Object store y índices creados');
                }
            };
        });

        return this.initPromise;
    }

    /**
     * Asegura que la base de datos esté inicializada
     */
    private async ensureDB(): Promise<IDBDatabase> {
        if (!this.db) {
            await this.init();
        }
        if (!this.db) {
            throw new Error('No se pudo inicializar IndexedDB');
        }
        return this.db;
    }

    /**
     * Agrega una nueva acción al historial (IndexedDB local + servidor)
     */
    async addAction(action: ActionHistoryEntry): Promise<void> {
        // 1. Guardar en IndexedDB local (para acceso rápido y offline)
        const db = await this.ensureDB();
        
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(action);

            request.onsuccess = () => {
                console.log('✅ Acción agregada al historial local:', action.id);
                resolve();
            };

            request.onerror = () => {
                console.error('Error al agregar acción en IndexedDB:', request.error);
                reject(request.error);
            };
        });

        // 2. Guardar en el servidor (para sincronización entre dispositivos)
        try {
            const response = await fetch('/api/action-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(action)
            });

            if (!response.ok) {
                throw new Error(`Error al guardar en servidor: ${response.status}`);
            }

            console.log('✅ Acción sincronizada con el servidor:', action.id);
        } catch (error) {
            console.error('⚠️ Error al sincronizar con servidor (continuando):', error);
            // No bloqueamos si falla el servidor, el historial local ya está guardado
        }
    }


    /**
     * Obtiene todas las acciones de un contexto específico (desde el servidor)
     */
    async getActionsByContext(contextId: string): Promise<ActionHistoryEntry[]> {
        try {
            // Intentar obtener del servidor primero
            const response = await fetch(`/api/action-history/${contextId}`);
            
            if (response.ok) {
                const serverActions = await response.json();
                console.log(`✅ Historial obtenido del servidor para ${contextId}:`, serverActions.length, 'acciones');
                
                // Sincronizar con IndexedDB local (opcional, para caché)
                try {
                    const db = await this.ensureDB();
                    const transaction = db.transaction([STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(STORE_NAME);
                    
                    for (const action of serverActions) {
                        try {
                            await new Promise((resolve, reject) => {
                                const request = store.put(action); // put = add or update
                                request.onsuccess = () => resolve(true);
                                request.onerror = () => reject(request.error);
                            });
                        } catch (err) {
                            // Ignorar duplicados
                        }
                    }
                } catch (err) {
                    console.warn('No se pudo sincronizar con IndexedDB local:', err);
                }
                
                return serverActions;
            }
        } catch (error) {
            console.warn('⚠️ Error al obtener historial del servidor, usando caché local:', error);
        }

        // Fallback: obtener de IndexedDB local si el servidor falla
        const db = await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('contextId');
            const request = index.getAll(contextId);

            request.onsuccess = () => {
                const actions = request.result as ActionHistoryEntry[];
                // Ordenar por timestamp descendente (más reciente primero)
                actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                console.log(`📦 Historial obtenido del caché local para ${contextId}:`, actions.length, 'acciones');
                resolve(actions);
            };

            request.onerror = () => {
                console.error('Error al obtener acciones por contexto:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Obtiene todas las acciones del usuario actual
     */
    async getActionsByUser(userId: string, limit: number = 50): Promise<ActionHistoryEntry[]> {
        const db = await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => {
                const actions = request.result as ActionHistoryEntry[];
                // Ordenar por timestamp descendente y limitar
                actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                resolve(actions.slice(0, limit));
            };

            request.onerror = () => {
                console.error('Error al obtener acciones por usuario:', request.error);
                reject(request.error);
            };
        });
    }


    /**
     * Limpia todas las acciones antiguas (más de X días)
     */
    async cleanOldActions(daysToKeep: number = 30): Promise<number> {
        const db = await this.ensureDB();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffTimestamp = cutoffDate.toISOString();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('timestamp');
            const request = index.openCursor();
            
            let deletedCount = 0;

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
                
                if (cursor) {
                    const action = cursor.value as ActionHistoryEntry;
                    if (action.timestamp < cutoffTimestamp) {
                        cursor.delete();
                        deletedCount++;
                    }
                    cursor.continue();
                } else {
                    console.log(`✅ Limpiadas ${deletedCount} acciones antiguas`);
                    resolve(deletedCount);
                }
            };

            request.onerror = () => {
                console.error('Error al limpiar acciones antiguas:', request.error);
                reject(request.error);
            };
        });
    }

}

// Exportar instancia singleton
export const actionHistoryDB = new ActionHistoryDB();
