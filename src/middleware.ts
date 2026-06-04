import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://next-js-cmdb.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

const STATIC = ["/_next/", "/favicon.ico", "/icon.png", "/api/auth/"];

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

function passwordPage(originalUrl: string): Response {
  // Escape single quotes for safe JS string injection
  const safeUrl = originalUrl.replace(/'/g, "\\'");
  return new Response(
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>CMDB — SENA CCYS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      background:#0d0d11;
      min-height:100dvh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:1rem;
      font-family:'Inter',sans-serif;
      color:#fff;
      -webkit-font-smoothing:antialiased;
    }
    body::before{
      content:'';
      position:fixed;
      inset:0;
      pointer-events:none;
      background:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(57,169,0,0.06) 0%,transparent 60%);
    }
    .card{
      position:relative;
      width:100%;
      max-width:22rem;
      border-radius:1.5rem;
      padding:2.5rem;
      background:linear-gradient(135deg,rgba(30,30,42,0.7),rgba(26,26,34,0.5));
      border:1px solid rgba(255,255,255,0.04);
      backdrop-filter:blur(24px);
      box-shadow:4px 4px 12px rgba(0,0,0,0.4),-4px -4px 12px rgba(255,255,255,0.03);
      animation:fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes fadeUp{
      from{opacity:0;transform:translateY(20px)}
      to{opacity:1;transform:translateY(0)}
    }
    .icon{
      width:3.5rem;height:3.5rem;
      margin:0 auto 1.75rem;
      border-radius:1rem;
      display:flex;align-items:center;justify-content:center;
      background:rgba(57,169,0,0.08);
    }
    .icon svg{width:1.75rem;height:1.75rem;color:#39a900;stroke-width:1.75}
    h1{
      font-family:'Sora','Inter',sans-serif;
      font-size:1.2rem;
      font-weight:700;
      letter-spacing:-0.02em;
      text-align:center;
      color:#fff;
      margin-bottom:0.25rem;
    }
    p{
      text-align:center;
      font-size:0.875rem;
      color:rgba(255,255,255,0.4);
      margin-bottom:2rem;
    }
    label{
      display:block;
      font-size:0.6875rem;
      font-weight:600;
      text-transform:uppercase;
      letter-spacing:0.12em;
      color:rgba(255,255,255,0.35);
      margin-bottom:0.5rem;
    }
    .input-wrap{
      position:relative;
    }
    input{
      width:100%;
      padding:0.75rem 1rem;
      border-radius:0.75rem;
      border:1px solid rgba(255,255,255,0.06);
      background:rgba(13,13,17,0.6);
      color:#fff;
      font-size:0.875rem;
      font-family:'Inter',sans-serif;
      outline:none;
      transition:all 0.2s cubic-bezier(0.22,1,0.36,1);
      box-shadow:inset 2px 2px 6px rgba(0,0,0,0.5),inset -2px -2px 6px rgba(255,255,255,0.02);
    }
    input:focus{
      border-color:#39a900;
      box-shadow:inset 0 0 0 2px rgba(57,169,0,0.12),inset 2px 2px 6px rgba(0,0,0,0.5);
    }
    input::placeholder{color:rgba(255,255,255,0.1)}
    .error{
      font-size:0.8125rem;
      color:#ef4444;
      font-weight:500;
      margin-top:0.5rem;
      min-height:1.25rem;
    }
    button{
      width:100%;
      margin-top:0.5rem;
      padding:0.75rem 1.5rem;
      border-radius:0.75rem;
      font-size:0.875rem;
      font-weight:600;
      font-family:'Inter',sans-serif;
      cursor:pointer;
      transition:all 0.2s cubic-bezier(0.22,1,0.36,1);
      background:rgba(57,169,0,0.08);
      color:#39a900;
      border:1px solid rgba(57,169,0,0.15);
      box-shadow:inset 2px 2px 6px rgba(0,0,0,0.3),inset -2px -2px 6px rgba(255,255,255,0.02);
      outline:none;
    }
    button:hover{transform:translateY(-2px);box-shadow:4px 4px 12px rgba(0,0,0,0.3),-4px -4px 12px rgba(255,255,255,0.03)}
    button:active{transform:translateY(0);box-shadow:inset 2px 2px 6px rgba(0,0,0,0.3),inset -2px -2px 6px rgba(255,255,255,0.02)}
    .footer{
      position:fixed;
      bottom:1.5rem;
      left:0;right:0;
      text-align:center;
      font-size:0.65rem;
      color:rgba(255,255,255,0.08);
      letter-spacing:0.1em;
      text-transform:uppercase;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
      </svg>
    </div>
    <h1>Acceso restringido</h1>
    <p>Ingresá la contraseña para acceder al CMDB</p>
    <form id="loginForm">
      <label for="password">Contraseña</label>
      <div class="input-wrap">
        <input id="password" type="password" placeholder="••••••••" autocomplete="current-password"/>
      </div>
      <div class="error" id="error"></div>
      <button type="submit">Entrar</button>
    </form>
  </div>
  <div class="footer">SENA CCYS — Gestión CMDB</div>
  <script>
    document.getElementById('password').focus();
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = this.querySelector('button');
      var err = document.getElementById('error');
      var pw = document.getElementById('password').value;
      if (!pw.trim()) { err.textContent = 'Ingresá la contraseña'; return; }
      btn.disabled = true;
      btn.textContent = 'Verificando…';
      try {
        var r = await fetch('/api/auth/login', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({password:pw})
        });
        if (r.ok) { window.location.href = '${safeUrl}'; return; }
        var d = await r.json();
        err.textContent = d.error || 'Contraseña incorrecta';
      } catch(_) { err.textContent = 'Error de conexión'; }
      btn.disabled = false;
      btn.textContent = 'Entrar';
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
    });
  </script>
</body>
</html>`,
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 401,
    }
  );
}

/**
 * Two-layer guard:
 *  1. Auth — checks cmdb-auth cookie or ?key= URL param against PAGE_KEY env var
 *  2. Origin — validates Origin/Referer on write API operations
 *
 *  No login page. When unauthenticated, middleware serves a password card inline.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Bypass static assets & the auth API itself ─────────────
  if (STATIC.some((p) => pathname.startsWith(p))) {
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

  // ── URL param ?key= (for PS1 script) ───────────────────────
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

  // ── API routes → 401 ───────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  // ── Page routes → serve password card inline ───────────────
  return passwordPage(pathname + request.nextUrl.search);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png).*)",
  ],
};
