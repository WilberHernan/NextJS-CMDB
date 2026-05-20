import { NextResponse } from "next/server";
import { obtenerValidacionesManuales } from "@/repositories/equipment.repository";

export async function GET() {
  try {
    const validaciones = await obtenerValidacionesManuales();
    return NextResponse.json({ ok: true, data: validaciones });
  } catch (error) {
    console.error("Error en validaciones:", error);
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
