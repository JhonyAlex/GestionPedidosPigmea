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
        weeks: data.weeklyData.length,
        machines: data.machineKeys.sort(),
        filter: data.dateFilter
    });
    return btoa(str).substring(0, 20);
}

/**
 * Llama al backend para generar análisis (el backend maneja OpenRouter de forma segura)
 */
export async function generateProductionAnalysis(request: AnalysisRequest): Promise<string> {
    try {
        // Llamar al backend en lugar de OpenRouter directamente
        const response = await fetch('/api/analysis/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Headers de autenticación se agregan automáticamente por getAuthHeaders
                ...getAuthHeaders()
            },
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
 * (debe importarse del hook de autenticación o implementarse aquí)
 */
function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Obtener userId del localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
        headers['X-User-ID'] = userId;
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
