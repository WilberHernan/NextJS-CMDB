import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST (request: NextRequest) {
  try {
    // ── Rate limiting by IP ──
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: `Demasiados intentos. Probá de nuevo en ${rateCheck.resetInSeconds} segundos.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetInSeconds),
          },
        }
      );
    }

    const body = await request.json();
    const { password } = body;

    const PAGE_KEY = process.env.PAGE_KEY;
    if (!PAGE_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Autenticación no configurada' },
        { status: 500 }
      );
    }

    if (!password || password !== PAGE_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set('cmdb-auth', PAGE_KEY, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 28800, // 8 horas — dura el día laboral
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Solicitud inválida' },
      { status: 400 }
    );
  }
}
