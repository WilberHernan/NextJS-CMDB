import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const PAGE_KEY = process.env.PAGE_KEY;
    if (!PAGE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Autenticación no configurada" },
        { status: 500 }
      );
    }

    if (!password || password !== PAGE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("cmdb-auth", PAGE_KEY, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida" },
      { status: 400 }
    );
  }
}
