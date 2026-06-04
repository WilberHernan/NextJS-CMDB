import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://next-js-cmdb.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

/**
 * Lightweight origin guard for write API endpoints.
 * Browser requests include Origin/Referer automatically.
 * Blocks scripts/curl without a valid origin on write operations.
 */
export function middleware(request: NextRequest) {
  // Only guard write operations
  if (request.method !== "POST" && request.method !== "PUT" && request.method !== "DELETE") {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin") || request.headers.get("referer") || "";

  if (!origin) {
    return NextResponse.json(
      { ok: false, error: "Se requiere origen para operaciones de escritura" },
      { status: 403 }
    );
  }

  const isAllowed = ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));

  if (!isAllowed) {
    return NextResponse.json(
      { ok: false, error: "Origen no autorizado" },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
