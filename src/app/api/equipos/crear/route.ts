import { NextRequest, NextResponse } from "next/server";
import { crearEquipo } from "@/repositories/equipment.repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hoja, valores } = body;

    if (!hoja || !valores) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos requeridos (hoja, valores)" },
        { status: 400 }
      );
    }

    const resultado = await crearEquipo({ hoja, valores });

    return NextResponse.json({ ok: true, data: resultado });
  } catch (error) {
    console.error("Error en crearEquipo:", error);
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
