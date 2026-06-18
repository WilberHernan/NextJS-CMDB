import { NextRequest, NextResponse } from 'next/server';
import { crearEquipo } from '@/repositories/equipment.repository';
import { isSede } from '@/lib/sedes';
import { crearEquipoSchema } from '@/lib/validation';

export async function POST (request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = crearEquipoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { hoja, valores, sede: sedeRaw } = parsed.data;
    const sede = isSede(sedeRaw) ? sedeRaw : 'CCYS';

    const resultado = await crearEquipo({ hoja, valores, sede });

    return NextResponse.json({ ok: true, data: resultado });
  } catch (error) {
    console.error('Error en crearEquipo:', error);
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
