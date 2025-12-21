import { ActionHistoryEntry, ActionType, ActionStatus } from '../types';

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
                    objectStore.createIndex('status', 'status', { unique: false });
                    
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
     * Agrega una nueva acción al historial
     */
    async addAction(action: ActionHistoryEntry): Promise<void> {
        const db = await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(action);

            request.onsuccess = () => {
                console.log('✅ Acción agregada al historial:', action.id);
                resolve();
            };

            request.onerror = () => {
                console.error('Error al agregar acción:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Actualiza el estado de una acción
     */
    async updateActionStatus(actionId: string, status: ActionStatus): Promise<void> {
        const db = await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(actionId);

            getRequest.onsuccess = () => {
                const action = getRequest.result as ActionHistoryEntry;
                if (action) {
                    action.status = status;
                    const updateRequest = store.put(action);

                    updateRequest.onsuccess = () => {
                        console.log(`✅ Acción ${actionId} actualizada a estado: ${status}`);
                        resolve();
                    };

                    updateRequest.onerror = () => {
                        console.error('Error al actualizar acción:', updateRequest.error);
                        reject(updateRequest.error);
                    };
                } else {
                    reject(new Error(`Acción ${actionId} no encontrada`));
                }
            };

            getRequest.onerror = () => {
                console.error('Error al obtener acción:', getRequest.error);
                reject(getRequest.error);
            };
        });
    }

    /**
     * Obtiene todas las acciones de un contexto específico
     */
    async getActionsByContext(contextId: string): Promise<ActionHistoryEntry[]> {
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
     * Obtiene la última acción aplicada (para undo)
     */
    async getLastAppliedAction(userId: string): Promise<ActionHistoryEntry | null> {
        const db = await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => {
                const actions = request.result as ActionHistoryEntry[];
                
                // Filtrar solo acciones aplicadas y ordenar por timestamp
                const appliedActions = actions
                    .filter(a => a.status === 'applied')
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                
                resolve(appliedActions.length > 0 ? appliedActions[0] : null);
            };

            request.onerror = () => {
                console.error('Error al obtener última acción:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Obtiene la última acción deshecha (para redo)
     */
    async getLastUndoneAction(userId: string): Promise<ActionHistoryEntry | null> {
        const db = await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => {
                const actions = request.result as ActionHistoryEntry[];
                
                // Filtrar solo acciones deshechas y ordenar por timestamp
                const undoneActions = actions
                    .filter(a => a.status === 'undone')
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                
                resolve(undoneActions.length > 0 ? undoneActions[0] : null);
            };

            request.onerror = () => {
                console.error('Error al obtener última acción deshecha:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Purga acciones del historial basadas en criterios
     * Se llama cuando un contexto cambia y las acciones ya no son válidas
     */
    async purgeActionsByContext(contextId: string): Promise<number> {
        const db = await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('contextId');
            const request = index.openCursor(contextId);
            
            let deletedCount = 0;

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
                
                if (cursor) {
                    cursor.delete();
                    deletedCount++;
                    cursor.continue();
                } else {
                    console.log(`✅ Purgadas ${deletedCount} acciones del contexto ${contextId}`);
                    resolve(deletedCount);
                }
            };

            request.onerror = () => {
                console.error('Error al purgar acciones:', request.error);
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

    /**
     * Limpia todas las acciones (útil para debug o reset)
     */
    async clearAll(): Promise<void> {
        const db = await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('✅ Todas las acciones han sido limpiadas');
                resolve();
            };

            request.onerror = () => {
                console.error('Error al limpiar acciones:', request.error);
                reject(request.error);
            };
        });
    }
}

// Exportar instancia singleton
export const actionHistoryDB = new ActionHistoryDB();
