import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://next-js-cmdb.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

function originGuard(request: NextRequest): NextResponse | null {
  if (request.method !== "POST" && request.method !== "PUT" && request.method !== "DELETE") {
    return null;
  }
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  if (!origin) {
    return NextResponse.json(
      { ok: false, error: "Se requiere origen para operaciones de escritura" },
      { status: 403 }
    );
  }
  const ok = ALLOWED_ORIGINS.some((a) => origin.startsWith(a));
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Origen no autorizado" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Auth guard — only blocks API routes.
 * Page routes pass through so the React app loads behind a blur overlay.
 * The ?key= param (PS1 script) still sets the cookie and redirects clean.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Always let static assets through ───────────────────────
  if (pathname.startsWith("/_next/") || pathname === "/favicon.ico" || pathname === "/icon.png") {
    return NextResponse.next();
  }

  // ── Always let auth API through (login, check) ──────────────
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const PAGE_KEY = process.env.PAGE_KEY;
  if (!PAGE_KEY) {
    return originGuard(request) ?? NextResponse.next();
  }

  // ── Cookie check ───────────────────────────────────────────
  const authCookie = request.cookies.get("cmdb-auth");
  if (authCookie?.value === PAGE_KEY) {
    return originGuard(request) ?? NextResponse.next();
  }

  // ── URL param ?key= (for PS1 script) — sets cookie & redirects clean ──
  const urlKey = request.nextUrl.searchParams.get("key");
  if (urlKey && urlKey === PAGE_KEY) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("key");
    const response = NextResponse.redirect(url);
    response.cookies.set("cmdb-auth", PAGE_KEY, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return response;
  }

  // ── API routes (non-auth) → 401 ────────────────────────────
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  // ── Page routes → let through (AuthGate handles UI blur) ───
  return originGuard(request) ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png).*)",
  ],
};
