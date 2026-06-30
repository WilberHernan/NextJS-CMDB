import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isSede, SEDE_LABELS, type Sede } from '@/lib/sedes';
import { APP_VERSION } from '@/lib/version';

/**
 * Replaces placeholders in the GUIA template with actual values.
 * Pure function — no I/O, fully testable without mocking.
 */
export function renderGuiaTemplate (template: string, sede: Sede): string {
  return template
    .replace(/__SEDE_LABEL__/g, SEDE_LABELS[sede])
    .replace(/__SCRIPT_VERSION__/g, APP_VERSION);
}

export async function GET (request: NextRequest) {
  const sedeParam = request.nextUrl.searchParams.get('sede') || 'CCYS';
  const sede = isSede(sedeParam) ? (sedeParam as Sede) : 'CCYS';

  const templatePath = path.join(
    process.cwd(),
    'inventario-scripts',
    'tools',
    'templates',
    'GUIA-EJECUCION.txt'
  );

  try {
    const template = await fs.readFile(templatePath, 'utf-8');
    const content = renderGuiaTemplate(template, sede);
    return new NextResponse(content, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new NextResponse(
      'Guía no disponible para esta sede.',
      { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
}
