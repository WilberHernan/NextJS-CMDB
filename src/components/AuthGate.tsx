"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [showCard, setShowCard] = useState(false);
  const [fade, setFade] = useState(false); // overlay visible by default
  const [mounted, setMounted] = useState(true);   // unmount overlay after fade-out
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check auth on mount
  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => {
        if (r.ok) {
          setFade(true);
          setTimeout(() => setMounted(false), 550);
        } else {
          setShowCard(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      })
      .catch(() => setShowCard(true));
  }, []);

  // Clear auth cookie when tab closes (pagehide fires on close/reload)
  useEffect(() => {
    const handlePageHide = () => {
      navigator.sendBeacon("/api/auth/logout");
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!password.trim()) {
        setError("Ingresá la contraseña");
        return;
      }
      setSubmitting(true);
      setError("");
      try {
        const r = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (r.ok) {
          setShowCard(false);
          setFade(true);
          setTimeout(() => setMounted(false), 550);
        } else {
          const d = await r.json();
          setError(d.error || "Contraseña incorrecta");
          setPassword("");
          inputRef.current?.focus();
        }
      } catch {
        setError("Error de conexión");
      } finally {
        setSubmitting(false);
      }
    },
    [password]
  );

  return (
    <>
      {children}

      {/* ── Lock screen — unmounts after fade to reduce DOM weight ── */}
      {mounted && <div
        className="fixed inset-0 z-[9999] transition-opacity duration-500 ease-out"
        style={{
          opacity: fade ? 0 : 1,
          pointerEvents: fade ? "none" : "auto",
        }}
      >
        {/* Blur backdrop */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.12)",
          }}
        />

        {/* Card container */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          {showCard && (
            <div
              className="w-full max-w-sm"
              style={{
                animation: "gate-card-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              {/* ── Premium frosted-glass card ── */}
              <div
                className="relative rounded-[1.25rem] p-7 sm:p-8 overflow-hidden"
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(32px) saturate(160%)",
                  WebkitBackdropFilter: "blur(32px) saturate(160%)",
                  border: "1px solid var(--glass-border)",
                  boxShadow: `
                    4px 4px 16px var(--neu-shadow-dark),
                    -4px -4px 16px var(--neu-shadow-light),
                    0 1px 0 0 var(--glass-highlight) inset,
                    0 0 0 1px rgba(255,255,255,0.03) inset
                  `,
                }}
              >
                {/* ── Grain texture (esmerilizado) ── */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-[inherit]"
                  style={{
                    opacity: 0.035,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "180px 180px",
                    mixBlendMode: "overlay" as React.CSSProperties["mixBlendMode"],
                  }}
                />

                {/* ── Top edge glow ── */}
                <div
                  className="absolute top-0 left-[15%] right-[15%] h-[1px] pointer-events-none rounded-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                  }}
                />

                {/* ── Lock icon ── */}
                <div
                  className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--accent-muted)",
                    boxShadow: `
                      inset 2px 2px 4px var(--neu-shadow-dark),
                      inset -2px -2px 4px var(--neu-shadow-light)
                    `,
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>

                {/* ── Heading ── */}
                <h1
                  className="text-center text-[1.15rem] font-bold tracking-[-0.02em] mb-1"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  Acceso restringido
                </h1>
                <p
                  className="text-center text-sm mb-7"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Ingresá la contraseña para acceder
                </p>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} noValidate>
                  <label
                    className="block text-[0.65rem] font-semibold uppercase tracking-[0.13em] mb-2"
                    style={{ color: "var(--text-tertiary)" }}
                    htmlFor="gate-password"
                  >
                    Contraseña
                  </label>
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{
                      boxShadow:
                        "inset 2px 2px 6px var(--neu-shadow-dark), inset -2px -2px 6px var(--neu-shadow-light)",
                    }}
                  >
                    <input
                      ref={inputRef}
                      id="gate-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={submitting}
                      className="w-full px-4 py-[0.7rem] pr-12 text-sm bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-disabled)] disabled:opacity-50"
                      style={{ fontFamily: "var(--font-sans), sans-serif" }}
                    />

                    {/* ── Eye toggle ── */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 disabled:opacity-30"
                      style={{
                        background: "var(--accent-muted)",
                        border: "1px solid var(--border-accent)",
                        boxShadow: showPassword
                          ? "inset 1px 1px 3px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)"
                          : "1px 1px 3px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)",
                      }}
                      onMouseEnter={(e) => {
                        if (!submitting)
                          e.currentTarget.style.transform =
                            "translateY(-50%) translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(-50%)";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.boxShadow =
                          "inset 1px 1px 3px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)";
                      }}
                      onMouseUp={(e) => {
                        if (!submitting)
                          e.currentTarget.style.boxShadow = showPassword
                            ? "inset 1px 1px 3px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)"
                            : "1px 1px 3px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)";
                      }}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        /* Eye open */
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        /* Eye closed */
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Error */}
                  <div
                    className="text-xs font-medium mt-2 min-h-[1.25rem] transition-opacity"
                    style={{
                      color: "var(--danger)",
                      opacity: error ? 1 : 0,
                    }}
                  >
                    {error || " "}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-1 rounded-xl px-5 py-[0.7rem] text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                    style={{
                      background: "var(--accent-muted)",
                      color: "var(--accent)",
                      border: "1px solid var(--border-accent)",
                      boxShadow: submitting
                        ? "inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)"
                        : "2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)",
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting)
                        e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.boxShadow =
                        "inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)";
                    }}
                    onMouseUp={(e) => {
                      if (!submitting)
                        e.currentTarget.style.boxShadow =
                          "2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)";
                    }}
                  >
                    {submitting ? "Verificando…" : "Entrar"}
                  </button>
                </form>

                {/* ── Footer watermark ── */}
                <div
                  className="mt-8 text-center text-[0.6rem] uppercase tracking-[0.15em]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  SENA CCYS — Gestión CMDB
                </div>
              </div>
            </div>
          )}
        </div>
      </div>}
    </>
  );
}
