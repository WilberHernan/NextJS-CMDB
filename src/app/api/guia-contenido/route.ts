import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isSede, type Sede } from '@/lib/sedes';

export async function GET (request: NextRequest) {
  const sedeParam = request.nextUrl.searchParams.get('sede') || 'CCYS';
  const sede = isSede(sedeParam) ? (sedeParam as Sede) : 'CCYS';

  const filePath = path.join(
    process.cwd(),
    'inventario-scripts',
    sede,
    'Mac y Linux',
    'GUIA-EJECUCION.txt'
  );

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return new NextResponse(content, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new NextResponse(
      'Guía no disponible para esta sede. Verificá que los archivos estén en su lugar.',
      { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
}
