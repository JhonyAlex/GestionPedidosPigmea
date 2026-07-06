import { describe, it, expect } from 'vitest';
import { getSemanaFromDate, parseSemanaLabel, getWeeksSelectOptions } from './weekUtils';

// ============================================================================
// getSemanaFromDate
// ============================================================================
describe('getSemanaFromDate', () => {
  it('returns "Sem 24 (08-12 jun) 2026" for June 10, 2026', () => {
    const result = getSemanaFromDate(new Date(2026, 5, 10)); // month is 0-indexed
    expect(result).toBe('Sem 24 (08-12 jun) 2026');
  });

  it('returns week 1 label for January 1, 2026 (cross-year ISO week)', () => {
    const result = getSemanaFromDate(new Date(2026, 0, 1));
    // Week 1 of 2026: Monday Dec 29 2025 – Friday Jan 2 2026
    expect(result).toMatch(/^Sem 1 \(\d{2}-\d{2} [a-z]{3}\) 2026$/);
  });

  it('accepts a date string (ISO format)', () => {
    const result = getSemanaFromDate('2026-06-10');
    expect(result).toBe('Sem 24 (08-12 jun) 2026');
  });

  it('returns empty string for an invalid date', () => {
    const result = getSemanaFromDate('not-a-date');
    expect(result).toBe('');
  });

  it('returns empty string for an empty string', () => {
    const result = getSemanaFromDate('');
    expect(result).toBe('');
  });
});

// ============================================================================
// parseSemanaLabel
// ============================================================================
describe('parseSemanaLabel', () => {
  it('parses "Sem 24 (08-12 jun) 2026" to { week: 24, year: 2026 }', () => {
    const result = parseSemanaLabel('Sem 24 (08-12 jun) 2026');
    expect(result).toEqual({ week: 24, year: 2026 });
  });

  it('parses a single-digit week "Sem 1 (29-02 ene) 2026"', () => {
    const result = parseSemanaLabel('Sem 1 (29-02 ene) 2026');
    expect(result).toEqual({ week: 1, year: 2026 });
  });

  it('parses a double-digit week "Sem 52 (21-25 dic) 2026"', () => {
    const result = parseSemanaLabel('Sem 52 (21-25 dic) 2026');
    expect(result).toEqual({ week: 52, year: 2026 });
  });

  it('is case-insensitive: "sem 10 (02-06 mar) 2026" works', () => {
    const result = parseSemanaLabel('sem 10 (02-06 mar) 2026');
    expect(result).toEqual({ week: 10, year: 2026 });
  });

  it('returns null for old format "Sem 24 - 2026"', () => {
    const result = parseSemanaLabel('Sem 24 - 2026');
    expect(result).toBeNull();
  });

  it('returns null for a completely invalid string', () => {
    const result = parseSemanaLabel('Not a valid label');
    expect(result).toBeNull();
  });

  it('returns null for an empty string', () => {
    const result = parseSemanaLabel('');
    expect(result).toBeNull();
  });

  it('returns null for a partial match like "Sem 24"', () => {
    const result = parseSemanaLabel('Sem 24');
    expect(result).toBeNull();
  });
});

// ============================================================================
// getWeeksSelectOptions
// ============================================================================
describe('getWeeksSelectOptions', () => {
  it('returns an array of { value, label } objects', () => {
    const options = getWeeksSelectOptions();
    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveProperty('value');
    expect(options[0]).toHaveProperty('label');
    expect(options[0].value).toBe(options[0].label);
  });

  it('returns 52 or 53 options for the current year', () => {
    const options = getWeeksSelectOptions();
    expect(options.length).toBeGreaterThanOrEqual(52);
    expect(options.length).toBeLessThanOrEqual(53);
  });

  it('first option matches new "Sem X (DD-DD mes) YYYY" format', () => {
    const options = getWeeksSelectOptions();
    expect(options[0].value).toMatch(/^Sem \d{1,2} \(\d{2}-\d{2} [a-z]{3}\) \d{4}$/);
  });

  it('last option matches new "Sem X (DD-DD mes) YYYY" format', () => {
    const options = getWeeksSelectOptions();
    expect(options[options.length - 1].value).toMatch(/^Sem \d{1,2} \(\d{2}-\d{2} [a-z]{3}\) \d{4}$/);
  });
});
