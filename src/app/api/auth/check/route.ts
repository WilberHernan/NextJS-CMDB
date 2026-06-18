import { NextRequest, NextResponse } from 'next/server';

export async function GET (request: NextRequest) {
  const PAGE_KEY = process.env.PAGE_KEY;

  // No key configured → open access
  if (!PAGE_KEY) {
    return NextResponse.json({ ok: true });
  }

  const authCookie = request.cookies.get('cmdb-auth');
  if (authCookie?.value === PAGE_KEY) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
