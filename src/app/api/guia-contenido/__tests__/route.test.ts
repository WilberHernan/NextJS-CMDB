import { describe, it, expect } from 'vitest';
import { renderGuiaTemplate } from '@/app/api/guia-contenido/route';

const TEMPLATE_FIXTURE = `
CMDB SENA — v__SCRIPT_VERSION__
Sede: __SEDE_LABEL__
============================
`.trim();

describe('renderGuiaTemplate', () => {
  it('reemplaza __SEDE_LABEL__ y __SCRIPT_VERSION__ en el contenido', () => {
    const result = renderGuiaTemplate(TEMPLATE_FIXTURE, 'CCYS');

    expect(result).toContain('Sede: CCYS');
    expect(result).toContain('v2.1.3');
    expect(result).not.toContain('__SEDE_LABEL__');
    expect(result).not.toContain('__SCRIPT_VERSION__');
  });

  it('usa el label correcto para CIUDAD_JARDIN', () => {
    const result = renderGuiaTemplate('__SEDE_LABEL__', 'CIUDAD_JARDIN');

    expect(result).toBe('CIUDAD JARDIN');
  });

  it('reemplaza todas las ocurrencias (global)', () => {
    const result = renderGuiaTemplate(
      'v__SCRIPT_VERSION__\nversion: __SCRIPT_VERSION__',
      'CCYS'
    );

    const matches = result.match(/2\.1\.3/g);
    expect(matches).toHaveLength(2);
  });

  it('falla para REGIONAL', () => {
    const result = renderGuiaTemplate('Sede: __SEDE_LABEL__', 'REGIONAL');

    expect(result).toBe('Sede: REGIONAL');
  });
});
