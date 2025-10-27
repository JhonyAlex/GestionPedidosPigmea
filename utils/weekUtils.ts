/**
 * Utilidades para trabajar con semanas del año
 */

/**
 * Obtiene el número de semana ISO 8601 de una fecha
 * La semana comienza el lunes y la primera semana contiene el primer jueves del año
 */
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Obtiene el rango de fechas (inicio y fin) de una semana específica de un año
 * @param year Año
 * @param week Número de semana (1-53)
 * @returns Objeto con fechas de inicio y fin de la semana
 */
export const getWeekDateRange = (year: number, week: number): { start: Date; end: Date } => {
  // Primer día del año
  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay() || 7; // Lunes = 1, Domingo = 7
  
  // Calcular el lunes de la semana 1
  const firstMonday = new Date(year, 0, 1 + (8 - jan1Day) % 7);
  if (jan1Day <= 4) {
    firstMonday.setDate(firstMonday.getDate() - 7);
  }
  
  // Calcular inicio de la semana solicitada
  const weekStart = new Date(firstMonday);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  weekStart.setHours(0, 0, 0, 0);
  
  // Calcular fin de la semana (domingo)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { start: weekStart, end: weekEnd };
};

/**
 * Obtiene la semana actual
 */
export const getCurrentWeek = (): { year: number; week: number } => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    week: getWeekNumber(now)
  };
};

/**
 * Genera una lista de todas las semanas de un año
 * @param year Año para el cual generar la lista
 * @returns Array de objetos con año, número de semana y rango de fechas
 */
export const getWeeksOfYear = (year: number): Array<{
  year: number;
  week: number;
  label: string;
  dateRange: string;
}> => {
  const weeks: Array<{
    year: number;
    week: number;
    label: string;
    dateRange: string;
  }> = [];
  
  // La mayoría de los años tienen 52 semanas, algunos 53
  const maxWeeks = getWeekNumber(new Date(year, 11, 28)) === 53 ? 53 : 52;
  
  for (let week = 1; week <= maxWeeks; week++) {
    const { start, end } = getWeekDateRange(year, week);
    const dateRange = `${formatDate(start)} - ${formatDate(end)}`;
    
    weeks.push({
      year,
      week,
      label: `Semana ${week}`,
      dateRange
    });
  }
  
  return weeks;
};

/**
 * Formatea una fecha en formato DD/MM
 */
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};

/**
 * Verifica si una fecha está dentro de una semana específica
 */
export const isDateInWeek = (date: Date | string, year: number, week: number): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { start, end } = getWeekDateRange(year, week);
  return d >= start && d <= end;
};

/**
 * Obtiene el año y semana de una fecha
 */
export const getYearAndWeek = (date: Date | string): { year: number; week: number } => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return {
    year: d.getFullYear(),
    week: getWeekNumber(d)
  };
};
