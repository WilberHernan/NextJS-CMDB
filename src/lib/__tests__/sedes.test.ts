import { describe, it, expect } from 'vitest';
import { SEDES, SEDE_LABELS, isSede } from '@/lib/sedes';

describe('SEDES', () => {
  it('contiene las 3 sedes esperadas', () => {
    expect(SEDES).toEqual(['CCYS', 'REGIONAL', 'CIUDAD_JARDIN']);
  });
});

describe('SEDE_LABELS', () => {
  it('tiene un label para cada sede en SEDES', () => {
    for (const sede of SEDES) {
      expect(SEDE_LABELS[sede]).toBeDefined();
      expect(SEDE_LABELS[sede]).toBeTypeOf('string');
    }
  });
});

describe('isSede', () => {
  it('devuelve true para sedes válidas', () => {
    expect(isSede('CCYS')).toBe(true);
    expect(isSede('REGIONAL')).toBe(true);
    expect(isSede('CIUDAD_JARDIN')).toBe(true);
  });

  it('devuelve false para sedes inválidas', () => {
    expect(isSede('BOGOTA')).toBe(false);
    expect(isSede('')).toBe(false);
  });

  it('maneja null y undefined sin romperse', () => {
    expect(isSede(null)).toBe(false);
    expect(isSede(undefined)).toBe(false);
  });
});
