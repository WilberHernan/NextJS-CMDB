import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://next-js-cmdb.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

const SKIP_AUTH = ["/_next/", "/favicon.ico", "/icon.png", "/login"];

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
 * Two-layer guard:
 *  1. Auth — checks cmdb-auth cookie or ?key= URL param against PAGE_KEY env var
 *  2. Origin — validates Origin/Referer on write API operations
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Bypass static assets & login page ──────────────────────
  if (SKIP_AUTH.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const PAGE_KEY = process.env.PAGE_KEY;
  if (!PAGE_KEY) {
    // No key configured → no auth (dev friendly)
    return originGuard(request) ?? NextResponse.next();
  }

  // ── Cookie check ───────────────────────────────────────────
  const authCookie = request.cookies.get("cmdb-auth");
  if (authCookie?.value === PAGE_KEY) {
    return originGuard(request) ?? NextResponse.next();
  }

  // ── URL param ?key= ────────────────────────────────────────
  const urlKey = request.nextUrl.searchParams.get("key");
  if (urlKey && urlKey === PAGE_KEY) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("key");

    const response = NextResponse.redirect(url);
    response.cookies.set("cmdb-auth", PAGE_KEY, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 h
      path: "/",
    });
    return response;
  }

  // ── API routes → 401 ───────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  // ── Page routes → redirect to login ────────────────────────
  const redirectTo = encodeURIComponent(pathname + request.nextUrl.search);
  return NextResponse.redirect(new URL(`/login?redirect=${redirectTo}`, request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png).*)",
  ],
};
