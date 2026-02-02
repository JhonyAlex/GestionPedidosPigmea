/**
 * Sistema de almacenamiento de configuraciones de mapeo en IndexedDB
 * Permite guardar y reutilizar mapeos de columnas Excel → BD
 */

import { ColumnMapping } from '../types';

const DB_NAME = 'PigmeaImportConfigs';
const DB_VERSION = 1;
const STORE_NAME = 'mappingConfigs';

export interface MappingConfig {
  id: string;
  name: string;
  description?: string;
  headers: string[]; // Headers originales del Excel
  mappings: ColumnMapping[];
  createdAt: string;
  lastUsed?: string;
  useCount: number;
}

/**
 * Inicializa la base de datos IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crear object store si no existe
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('lastUsed', 'lastUsed', { unique: false });
        console.log('📦 IndexedDB store created:', STORE_NAME);
      }
    };
  });
}

/**
 * Guarda una configuración de mapeo
 */
export async function saveMappingConfig(config: Omit<MappingConfig, 'id' | 'createdAt' | 'useCount'>): Promise<string> {
  const db = await initDB();

  const fullConfig: MappingConfig = {
    id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    useCount: 0,
    ...config
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(fullConfig);

    request.onsuccess = () => {
      console.log(`✅ Configuración guardada: "${fullConfig.name}" (${fullConfig.id})`);
      resolve(fullConfig.id);
    };
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Obtiene todas las configuraciones guardadas
 */
export async function getAllMappingConfigs(): Promise<MappingConfig[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const configs = request.result as MappingConfig[];
      // Ordenar por última vez usado, luego por creación
      configs.sort((a, b) => {
        if (a.lastUsed && b.lastUsed) {
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        }
        if (a.lastUsed) return -1;
        if (b.lastUsed) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      resolve(configs);
    };
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Obtiene una configuración específica por ID
 */
export async function getMappingConfig(id: string): Promise<MappingConfig | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Actualiza el contador de uso y última fecha de uso
 */
export async function updateConfigUsage(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const config = getRequest.result as MappingConfig;
      if (config) {
        config.useCount = (config.useCount || 0) + 1;
        config.lastUsed = new Date().toISOString();
        store.put(config);
        console.log(`📊 Config "${config.name}" usado ${config.useCount} veces`);
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Elimina una configuración
 */
export async function deleteMappingConfig(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`🗑️ Configuración eliminada: ${id}`);
      resolve();
    };
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Encuentra la mejor configuración compatible con los headers actuales
 * @param currentHeaders - Headers del Excel actual
 * @returns Configuración más compatible o null
 */
export async function findCompatibleConfig(currentHeaders: string[]): Promise<MappingConfig | null> {
  const configs = await getAllMappingConfigs();
  if (configs.length === 0) return null;

  let bestMatch: MappingConfig | null = null;
  let bestScore = 0;

  for (const config of configs) {
    // Calcular similitud entre headers
    const matchingHeaders = config.headers.filter(h => 
      currentHeaders.some(ch => 
        h.toLowerCase().trim() === ch.toLowerCase().trim()
      )
    );

    const score = matchingHeaders.length / Math.max(config.headers.length, currentHeaders.length);

    // Requiere al menos 60% de similitud
    if (score > bestScore && score >= 0.6) {
      bestScore = score;
      bestMatch = config;
    }
  }

  if (bestMatch) {
    console.log(`🎯 Configuración compatible encontrada: "${bestMatch.name}" (${(bestScore * 100).toFixed(0)}% match)`);
  }

  return bestMatch;
}

/**
 * Aplica una configuración guardada a headers actuales
 * Intenta mapear columnas aunque no coincidan exactamente
 */
export function applyConfigToHeaders(
  config: MappingConfig,
  currentHeaders: string[]
): ColumnMapping[] {
  const newMappings: ColumnMapping[] = [];

  for (let i = 0; i < currentHeaders.length; i++) {
    const currentHeader = currentHeaders[i];
    
    // Buscar mapeo exacto por header
    let mapping = config.mappings.find(m => 
      m.excelColumn.toLowerCase().trim() === currentHeader.toLowerCase().trim()
    );

    // Si no hay match exacto, intentar por posición si los headers son similares
    if (!mapping && config.headers[i]) {
      const savedHeader = config.headers[i];
      const savedMapping = config.mappings.find(m => m.excelColumn === savedHeader);
      
      // Si el header guardado es similar al actual, usar ese mapeo
      if (savedMapping) {
        const similarity = calculateHeaderSimilarity(savedHeader, currentHeader);
        if (similarity > 0.6) {
          mapping = savedMapping;
        }
      }
    }

    // Si se encontró un mapeo, usarlo; sino, ignorar por defecto
    if (mapping) {
      newMappings.push({
        excelColumn: currentHeader,
        dbField: mapping.dbField,
        transform: mapping.transform
      });
    } else {
      newMappings.push({
        excelColumn: currentHeader,
        dbField: 'ignore',
        transform: 'text'
      });
    }
  }

  return newMappings;
}

/**
 * Calcula similitud entre dos headers
 */
function calculateHeaderSimilarity(a: string, b: string): number {
  const normalize = (str: string) => str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normA = normalize(a);
  const normB = normalize(b);

  if (normA === normB) return 1;
  if (normA.includes(normB) || normB.includes(normA)) return 0.8;

  // Levenshtein básico
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;

  let distance = 0;
  for (let i = 0; i < maxLen; i++) {
    if (normA[i] !== normB[i]) distance++;
  }

  return 1 - (distance / maxLen);
}
