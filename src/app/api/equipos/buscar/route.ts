import { NextRequest, NextResponse } from "next/server";
import { buscarEquipo } from "@/repositories/equipment.repository";
import { isSede } from "@/lib/sedes";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    const { searchParams } = new URL(request.url);
    const placa = searchParams.get("placa");
    const sedeRaw = searchParams.get("sede");
    const sede = isSede(sedeRaw) ? sedeRaw : "CCYS";

    console.log(`[${requestId}] GET buscar placa=${placa} sede=${sede}`);

    if (!placa) {
      return NextResponse.json(
        { ok: false, error: "Parámetro 'placa' requerido" },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] SPREADSHEET_ID_CCYS=${process.env.SPREADSHEET_ID_CCYS ? "✓ definido" : "✗ NO DEFINIDO"}`);
    console.log(`[${requestId}] SPREADSHEET_ID_REGIONAL=${process.env.SPREADSHEET_ID_REGIONAL ? "✓ definido" : "✗ NO DEFINIDO"}`);
    console.log(`[${requestId}] SPREADSHEET_ID_CIUDAD_JARDIN=${process.env.SPREADSHEET_ID_CIUDAD_JARDIN ? "✓ definido" : "✗ NO DEFINIDO"}`);

    const resultado = await buscarEquipo(placa, sede);

    if (!resultado) {
      return NextResponse.json(
        { ok: true, data: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, data: resultado });
  } catch (error) {
    console.error(`[${requestId}] Error en buscarEquipo:`, error);
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
