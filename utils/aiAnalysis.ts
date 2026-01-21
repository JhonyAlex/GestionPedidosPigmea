/**
 * AI Analysis Utilities
 * Integración con backend para análisis gerencial seguro
 */

interface WeeklyData {
    week: number;
    year: number;
    label: string;
    dateRange: string;
    machines: Record<string, number>;
    totalCapacity: number;
    totalLoad: number;
    freeCapacity: number;
}

interface AnalysisRequest {
    weeklyData: WeeklyData[];
    machineKeys: string[];
    dateFilter: string;
    selectedStages: string[];
    selectedMachines?: string[];
    customDateRange?: { start: string; end: string };
}

interface AnalysisResponse {
    analysis: string;
    timestamp: number;
    dataHash: string;
}

/**
 * Genera un hash simple de los datos para cache
 */
function generateDataHash(data: AnalysisRequest): string {
    const str = JSON.stringify({
        // Incluir datos completos de carga por semana y máquina
        weeklyData: data.weeklyData.map(w => ({
            label: w.label,
            machines: w.machines,
            freeCapacity: w.freeCapacity,
            totalLoad: w.totalLoad
        })),
        machines: data.machineKeys.sort(),
        filter: data.dateFilter,
        stages: data.selectedStages?.sort(),
        selectedMachines: data.selectedMachines?.sort(),
        dateRange: data.customDateRange
    });
    // Usar hash completo para evitar colisiones
    return btoa(str);
}

/**
 * Llama al backend para generar análisis (el backend maneja OpenRouter de forma segura)
 */
export async function generateProductionAnalysis(request: AnalysisRequest): Promise<string> {
    try {
        // Llamar al backend en lugar de OpenRouter directamente
        const response = await fetch('/api/analysis/generate', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                weeklyData: request.weeklyData,
                machineKeys: request.machineKeys,
                dateFilter: request.dateFilter,
                selectedStages: request.selectedStages
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || `Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.analysis) {
            throw new Error('Respuesta inválida del servidor');
        }

        return data.analysis;

    } catch (error) {
        console.error('Error generating AI analysis:', error);
        throw error;
    }
}

/**
 * Función auxiliar para obtener headers de autenticación
 * Compatible con el sistema de autenticación del proyecto
 */
function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    
    if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('pigmea_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                headers['x-user-id'] = String(user.id);
                headers['x-user-role'] = user.role || 'OPERATOR';
            } catch (error) {
                console.warn('Error parsing user from localStorage:', error);
            }
        }
    }
    
    return headers;
}

/**
 * IndexedDB para cache de análisis
 */
const DB_NAME = 'PigmeaAnalysis';
const DB_VERSION = 1;
const STORE_NAME = 'analysisCache';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'dataHash' });
            }
        };
    });
}

export async function saveAnalysisToCache(request: AnalysisRequest, analysis: string): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        const data: AnalysisResponse = {
            analysis,
            timestamp: Date.now(),
            dataHash: generateDataHash(request)
        };
        
        await store.put(data);
        db.close();
    } catch (error) {
        console.error('Error saving analysis to cache:', error);
    }
}

export async function getAnalysisFromCache(request: AnalysisRequest): Promise<string | null> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const hash = generateDataHash(request);
        
        const result = await new Promise<AnalysisResponse | undefined>((resolve, reject) => {
            const req = store.get(hash);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        
        db.close();
        
        if (!result) return null;
        
        // Cache válido por 1 hora
        const ONE_HOUR = 60 * 60 * 1000;
        if (Date.now() - result.timestamp > ONE_HOUR) {
            return null;
        }
        
        return result.analysis;
    } catch (error) {
        console.error('Error reading analysis from cache:', error);
        return null;
    }
}

/**
 * Limpia todo el cache de análisis
 */
export async function clearAnalysisCache(): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await store.clear();
        db.close();
        console.log('🗑️ Cache de análisis limpiado');
    } catch (error) {
        console.error('Error clearing analysis cache:', error);
    }
}
