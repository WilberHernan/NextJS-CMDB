import { NextRequest, NextResponse } from "next/server";
import { actualizarEquipo } from "@/repositories/equipment.repository";
import { isSede } from "@/lib/sedes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fila, hoja, valores, sede: sedeRaw } = body;
    const sede = isSede(sedeRaw) ? sedeRaw : "CCYS";

    if (!fila || !hoja || !valores) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos requeridos (fila, hoja, valores)" },
        { status: 400 }
      );
    }

    const resultado = await actualizarEquipo({ fila, hoja, valores, sede });

    return NextResponse.json({ ok: true, data: resultado });
  } catch (error) {
    console.error("Error en actualizarEquipo:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
