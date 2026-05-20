import { NextRequest, NextResponse } from "next/server";
import { buscarEquipo } from "@/repositories/equipment.repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placa = searchParams.get("placa");

    if (!placa) {
      return NextResponse.json(
        { ok: false, error: "Parámetro 'placa' requerido" },
        { status: 400 }
      );
    }

    const resultado = await buscarEquipo(placa);

    if (!resultado) {
      return NextResponse.json(
        { ok: true, data: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, data: resultado });
  } catch (error) {
    console.error("Error en buscarEquipo:", error);
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
