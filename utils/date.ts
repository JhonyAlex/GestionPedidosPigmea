
export type DateFilterOption = 'all' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';

export const getDateRange = (filter: DateFilterOption): { start: Date, end: Date } | null => {
    if (filter === 'all' || filter === 'custom') {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start: Date;
    let end: Date;

    switch (filter) {
        case 'this-week': {
            const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ...
            const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday is 0
            start = new Date(today.setDate(diffToMonday));
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            break;
        }
        case 'last-week': {
            const beforeOneWeek = new Date();
            beforeOneWeek.setDate(today.getDate() - 7);
            const dayOfWeek = beforeOneWeek.getDay();
            const diffToMonday = beforeOneWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            start = new Date(beforeOneWeek.setDate(diffToMonday));
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            break;
        }
        case 'this-month': {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        }
        case 'last-month': {
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        }
        default:
            return null;
    }

    end.setHours(23, 59, 59, 999); // Set end of day for the end date
    return { start, end };
};

// Función para formatear tiempo relativo
export const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 0) {
        return 'en el futuro';
    }
    
    const intervals = [
        { label: 'año', seconds: 31536000 },
        { label: 'mes', seconds: 2592000 },
        { label: 'día', seconds: 86400 },
        { label: 'hora', seconds: 3600 },
        { label: 'minuto', seconds: 60 },
    ];
    
    for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count >= 1) {
            const plural = count > 1 ? 's' : '';
            const timeString = `${count} ${interval.label}${plural}`;
            return options?.addSuffix ? `hace ${timeString}` : timeString;
        }
    }
    
    return options?.addSuffix ? 'hace unos segundos' : 'unos segundos';
};

/**
 * Formatea una fecha en formato DD/MM/YYYY
 * @param date Fecha a formatear (Date, string ISO, o timestamp)
 * @returns String con formato DD/MM/YYYY
 */
export const formatDateDDMMYYYY = (date: Date | string | number): string => {
    if (!date) {
        return 'N/A';
    }
    
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    if (!d || isNaN(d.getTime())) {
        return 'N/A';
    }
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
};

/**
 * Formatea una fecha y hora en formato DD/MM/YYYY HH:mm
 * @param date Fecha a formatear (Date, string ISO, o timestamp)
 * @returns String con formato DD/MM/YYYY HH:mm
 */
export const formatDateTimeDDMMYYYY = (date: Date | string | number): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) {
        return 'N/A';
    }
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};
