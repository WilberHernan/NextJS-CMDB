import { NextResponse } from "next/server";
import { getSheetsClient } from "@/services/sheets";

export async function GET() {
  try {
    const client = await getSheetsClient();

    const ccysId = process.env.SPREADSHEET_ID_CCYS;
    if (!ccysId) {
      return NextResponse.json(
        { ok: false, error: "SPREADSHEET_ID_CCYS no configurado" },
        { status: 503 }
      );
    }

    await client.spreadsheets.get({
      spreadsheetId: ccysId,
      ranges: [],
      includeGridData: false,
    });

    return NextResponse.json({ ok: true, status: "connected" });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo conectar con Google Sheets" },
      { status: 503 }
    );
  }
}
