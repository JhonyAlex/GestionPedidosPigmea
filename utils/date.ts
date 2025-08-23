export type DateFilterOption = 'all' | 'this-week' | 'last-week' | 'this-month' | 'last-month';

export const getDateRange = (filter: DateFilterOption): { start: Date, end: Date } | null => {
    if (filter === 'all') {
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
