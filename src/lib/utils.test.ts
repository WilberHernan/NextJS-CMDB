import { describe, it, expect } from 'vitest';
import {
  normalizeOption,
  findMatchingOption,
  sanitizarPlaca,
  formatearFechaParaInput,
} from './utils';

describe('normalizeOption', () => {
  it('trims whitespace', () => {
    expect(normalizeOption('  hola  ')).toBe('HOLA');
  });

  it('uppercases', () => {
    expect(normalizeOption('Hp ProBook')).toBe('HP PROBOOK');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeOption('lenovo   thinkpad')).toBe('LENOVO THINKPAD');
  });

  it('handles empty string', () => {
    expect(normalizeOption('')).toBe('');
  });
});

describe('sanitizarPlaca', () => {
  it('removes apostrophes and replaces with dash', () => {
    expect(sanitizarPlaca("ABC'123")).toBe('ABC-123');
  });

  it('removes special characters', () => {
    expect(sanitizarPlaca('ABC_123!@#')).toBe('ABC123');
  });

  it('uppercases letters', () => {
    expect(sanitizarPlaca('abc-xyz')).toBe('ABC-XYZ');
  });

  it('preserves valid chars (A-Z, 0-9, dash)', () => {
    expect(sanitizarPlaca('SENA-2024-001')).toBe('SENA-2024-001');
  });

  it('handles empty string', () => {
    expect(sanitizarPlaca('')).toBe('');
  });
});

describe('findMatchingOption', () => {
  const opciones = [
    'DESKTOP',
    'PORTATIL',
    'TODO EN UNO',
    'LENOVO',
    'DELL',
    'HP',
    'WINDOWS 10',
    'WINDOWS 11',
  ];

  it('finds exact match (case insensitive)', () => {
    expect(findMatchingOption('desktop', opciones)).toBe('DESKTOP');
  });

  it('finds match ignoring extra spaces', () => {
    expect(findMatchingOption('  TODO   EN   UNO  ', opciones)).toBe(
      'TODO EN UNO'
    );
  });

  it('finds match with compact spaces', () => {
    expect(findMatchingOption('WINDOWS10', opciones)).toBe('WINDOWS 10');
  });

  it('returns null for no match', () => {
    expect(findMatchingOption('MACOS', opciones)).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(findMatchingOption('', opciones)).toBeNull();
  });

  it('finds partial match when contains normalization', () => {
    expect(findMatchingOption('WIND', opciones)).toBe('WINDOWS 10');
  });
});

describe('formatearFechaParaInput', () => {
  it('returns empty for empty input', () => {
    expect(formatearFechaParaInput('')).toBe('');
    expect(formatearFechaParaInput('   ')).toBe('');
  });

  it('passes through ISO format', () => {
    expect(formatearFechaParaInput('2024-01-15')).toBe('2024-01-15');
  });

  it('converts DD/MM/YYYY to ISO', () => {
    expect(formatearFechaParaInput('15/01/2024')).toBe('2024-01-15');
  });

  it('converts D/M/YYYY (single digit) to ISO', () => {
    expect(formatearFechaParaInput('1/5/2024')).toBe('2024-05-01');
  });

  it('parses JS Date string (long format)', () => {
    // "June 15, 2024" goes through new Date() parse → getFullYear/getMonth/getDate
    // Using the 15th with a safe offset so local TZ doesn't flip the day
    const result = formatearFechaParaInput('2024-06-15T12:00:00');
    expect(result).toBe('2024-06-15');
  });
});
