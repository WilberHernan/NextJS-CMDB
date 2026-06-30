import { describe, it, expect } from 'vitest';
import { APP_VERSION } from '@/lib/version';

describe('APP_VERSION', () => {
  it('es un semver válido (X.Y.Z)', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('no está vacío', () => {
    expect(APP_VERSION.length).toBeGreaterThan(0);
  });
});
