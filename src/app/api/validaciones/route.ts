import { NextRequest, NextResponse } from 'next/server';
import { obtenerValidacionesManuales } from '@/repositories/equipment.repository';
import { isSede } from '@/lib/sedes';

export async function GET (request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sedeRaw = searchParams.get('sede');
    const sede = isSede(sedeRaw) ? sedeRaw : 'CCYS';

    const validaciones = await obtenerValidacionesManuales(sede);
    return NextResponse.json({ ok: true, data: validaciones });
  } catch (error) {
    console.error('Error en validaciones:', error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
