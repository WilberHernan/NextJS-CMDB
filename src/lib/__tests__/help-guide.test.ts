import { describe, it, expect } from 'vitest';
import { renderHelpGuide, getHelpSections } from '@/lib/help-guide';

describe('renderHelpGuide', () => {
  it('reemplaza __SEDE_LABEL__ y __SCRIPT_VERSION__', () => {
    const result = renderHelpGuide('Sede __SEDE_LABEL__ v__SCRIPT_VERSION__', 'CCYS');

    expect(result).toContain('Sede CCYS');
    expect(result).toContain('v2.1.3');
    expect(result).not.toContain('__SEDE_LABEL__');
  });

  it('usa el label correcto para CIUDAD_JARDIN', () => {
    expect(renderHelpGuide('__SEDE_LABEL__', 'CIUDAD_JARDIN')).toBe('CIUDAD JARDIN');
  });
});

describe('getHelpSections', () => {
  it('incluye secciones para cada plataforma', () => {
    const sections = getHelpSections('REGIONAL');
    const headers = sections
      .filter((s) => s.kind === 'header')
      .map((s) => (s.kind === 'header' ? s.text : ''));

    expect(headers).toContain('WINDOWS');
    expect(headers).toContain('LINUX');
    expect(headers).toContain('MACOS');
  });

  it('personaliza el bloque de soporte por sede', () => {
    const ccys = getHelpSections('CCYS').find(
      (s) => s.kind === 'text' && s.text.includes('sede')
    );
    const regional = getHelpSections('REGIONAL').find(
      (s) => s.kind === 'text' && s.text.includes('sede')
    );

    expect(ccys?.kind === 'text' && ccys.text).toContain('CCYS');
    expect(regional?.kind === 'text' && regional.text).toContain('REGIONAL');
  });
});
