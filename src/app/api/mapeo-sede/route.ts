import { NextResponse } from "next/server";
import { obtenerMapeoSedeId } from "@/repositories/equipment.repository";

export async function GET() {
  try {
    const mapeo = await obtenerMapeoSedeId();
    return NextResponse.json({ ok: true, data: mapeo });
  } catch (error) {
    console.error("Error en mapeo-sede:", error);
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
