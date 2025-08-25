import { Pedido } from '../types';

export interface DataStore<T extends { id: string }> {
  init(): Promise<void>;
  create(item: T): Promise<T>;
  update(item: T): Promise<T>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  clear(): Promise<void>;
  bulkInsert(items: T[]): Promise<void>;
}

export class IndexedDBStore<T extends { id: string }> implements DataStore<T> {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string, storeName: string) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          // Create indexes for fields that are often filtered or sorted
          store.createIndex('etapaActual', 'etapaActual', { unique: false });
          store.createIndex('prioridad', 'prioridad', { unique: false });
          store.createIndex('fechaCreacion', 'fechaCreacion', { unique: false });
          store.createIndex('fechaEntrega', 'fechaEntrega', { unique: false });
          store.createIndex('cliente', 'cliente', { unique: false });
          store.createIndex('orden', 'orden', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private getStore(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database is not initialized. Call init() first.");
    }
    const transaction = this.db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }
  
  private request<T>(request: IDBRequest): Promise<T> {
      return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
      });
  }

  public async create(item: T): Promise<T> {
    const store = this.getStore('readwrite');
    await this.request(store.add(item));
    return item;
  }

  public async update(item: T): Promise<T> {
    const store = this.getStore('readwrite');
    await this.request(store.put(item));
    return item;
  }

  public async delete(id: string): Promise<void> {
    const store = this.getStore('readwrite');
    await this.request(store.delete(id));
  }

  public async findById(id: string): Promise<T | undefined> {
    const store = this.getStore('readonly');
    return await this.request<T | undefined>(store.get(id));
  }

  public async getAll(): Promise<T[]> {
    const store = this.getStore('readonly');
    return await this.request<T[]>(store.getAll());
  }
  
  public async clear(): Promise<void> {
      const store = this.getStore('readwrite');
      await this.request(store.clear());
  }

  public async bulkInsert(items: T[]): Promise<void> {
    if (!this.db) {
        throw new Error("Database is not initialized. Call init() first.");
    }
    const transaction = this.db.transaction(this.storeName, 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    items.forEach(item => store.put(item)); // Use put to overwrite if exists, useful for imports

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
  }
}
