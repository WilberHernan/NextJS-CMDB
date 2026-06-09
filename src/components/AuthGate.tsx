"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSede } from "@/contexts/sede-context";
import { isSede, type Sede } from "@/lib/sedes";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type Stage = "loading" | "password" | "done";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("loading");
  const [fade, setFade] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sede, setSede } = useSede();
  const [selectedSede, setSelectedSede] = useState<Sede>("CCYS");

  // Sync selectedSede from context once it resolves
  useEffect(() => {
    if (sede) setSelectedSede(sede);
  }, [sede]);

  // ── Init: auto-login from key → check auth → resolve stage ──
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const params = new URLSearchParams(window.location.search);
      const keyFromUrl = params.get("key");

      if (keyFromUrl) {
        try {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: keyFromUrl }),
          });
        } catch {
          // Swallow — we'll check auth below
        }
      }

      // Check if authenticated
      try {
        const res = await fetch("/api/auth/check");
        if (res.ok && !cancelled) {
          finishAuth();
          return;
        }
      } catch {
        // Not authenticated — show password
      }

      if (!cancelled) {
        setStage("password");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Finish auth: set sede from URL or context, then done ──
  const finishAuth = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const sedeFromUrl = params.get("sede");

    if (isSede(sedeFromUrl)) {
      setSede(sedeFromUrl);
    }

    setStage("done");
    setFade(true);
    setTimeout(() => setMounted(false), 550);
  }, [setSede]);

  // ── Password submit ──
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
          setSede(selectedSede);
          setStage("done");
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
    [password, selectedSede, setSede]
  );

  // ── Logout on tab close ──
  useEffect(() => {
    const handlePageHide = () => {
      navigator.sendBeacon("/api/auth/logout");
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  return (
    <>
      {children}

      {mounted && (
        <div
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

          {/* Content container */}
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            {stage === "password" && (
              <PasswordCard
                password={password}
                setPassword={setPassword}
                error={error}
                setError={setError}
                submitting={submitting}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                selectedSede={selectedSede}
                setSelectedSede={setSelectedSede}
                onSubmit={handleSubmit}
                inputRef={inputRef}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ───────────────────────────────────────────────
 * Password card — integrated sede selector
 * ─────────────────────────────────────────────── */
function PasswordCard({
  password,
  setPassword,
  error,
  setError,
  submitting,
  showPassword,
  setShowPassword,
  selectedSede,
  setSelectedSede,
  onSubmit,
  inputRef,
}: {
  password: string;
  setPassword: (v: string) => void;
  error: string;
  setError: (v: string) => void;
  submitting: boolean;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  selectedSede: Sede;
  setSelectedSede: (v: Sede) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  /* ── Cinematic bubble selector ── */
  const [bubblesOpen, setBubblesOpen] = useState(false);
  const [exiting, setExiting] = useState<string | null>(null);
  const bubbleTriggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [bubblePos, setBubblePos] = useState({
    cardRight: 0,
    cardCenterY: 0,
    triggerLeft: 0,
    triggerTop: 0,
    triggerWidth: 0,
    triggerHeight: 0,
  });

  const BUBBLE_ITEMS: { value: Sede; label: string }[] = [
    { value: "CCYS", label: "CCYS" },
    { value: "REGIONAL", label: "REGIONAL" },
    { value: "CIUDAD_JARDIN", label: "CIUDAD_JARDIN" },
  ];

  const openBubbles = useCallback(() => {
    if (cardRef.current && bubbleTriggerRef.current) {
      const cr = cardRef.current.getBoundingClientRect();
      const tr = bubbleTriggerRef.current.getBoundingClientRect();
      setBubblePos({
        cardRight: cr.right,
        cardCenterY: cr.top + cr.height / 2,
        triggerLeft: tr.left,
        triggerTop: tr.top,
        triggerWidth: tr.width,
        triggerHeight: tr.height,
      });
    }
    setBubblesOpen(true);
  }, []);

  const selectBubble = useCallback(
    (sede: Sede) => {
      setExiting(sede);
      setTimeout(() => {
        setSelectedSede(sede);
        setExiting(null);
        setBubblesOpen(false);
      }, 450);
    },
    [setSelectedSede]
  );

  // Click-outside: close bubbles when clicking anywhere that isn't a bubble or the trigger
  useEffect(() => {
    if (!bubblesOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        bubbleTriggerRef.current &&
        !bubbleTriggerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-bubble]")
      ) {
        setExiting("__all__");
        setTimeout(() => {
          setExiting(null);
          setBubblesOpen(false);
        }, 450);
      }
    };
    const timer = setTimeout(() => document.addEventListener("click", handleClick), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [bubblesOpen]);

  return (
    <div
      ref={cardRef}
      className="w-full max-w-sm"
      style={{
        animation:
          "gate-card-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
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
        {/* Grain texture */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "180px 180px",
            mixBlendMode:
              "overlay" as React.CSSProperties["mixBlendMode"],
          }}
        />

        {/* Top edge glow */}
        <div
          className="absolute top-0 left-[15%] right-[15%] h-[1px] pointer-events-none rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          }}
        />

        {/* Lock icon */}
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

        <h1
          className="text-center text-[1.15rem] font-bold tracking-[-0.02em] mb-1"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Acceso restringido
        </h1>
        <p
          className="text-center text-sm mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          Elegí la sede e ingresá la contraseña
        </p>

        <form onSubmit={onSubmit} noValidate>
          {/* ── Sede selector — cinematic floating bubbles ── */}
          <label
            className="block text-[0.65rem] font-semibold uppercase tracking-[0.13em] mb-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            Sede
          </label>
          <div ref={bubbleTriggerRef} className="mb-5">
            <button
              type="button"
              onClick={openBubbles}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-xl bg-surface-input px-4 py-3 text-sm text-left text-foreground",
                "border border-border-default shadow-neu-pressed",
                "transition-all duration-200 ease-cinematic outline-none font-sans",
                "hover:border-border-hover",
                "focus-visible:border-accent focus-visible:shadow-[var(--focus-ring)]",
                bubblesOpen && "border-accent shadow-[var(--focus-ring)]"
              )}
            >
              <span
                className={cn(
                  "truncate",
                  !selectedSede && "text-muted-foreground"
                )}
              >
                {selectedSede || "Seleccione sede"}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  bubblesOpen && "rotate-180 text-accent"
                )}
              />
            </button>
          </div>

          {/* ── Floating bubbles (portal a document.body) ── */}
          {bubblesOpen && bubblePos.cardRight > 0 &&
            createPortal(
              <div
                className="fixed inset-0 pointer-events-none"
                style={{ zIndex: 100000 }}
              >
                {(() => {
                  const isMobile = window.innerWidth < 640;
                  return (
                    <div
                      style={{
                        position: "absolute",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        ...(isMobile
                          ? {
                              top: bubblePos.triggerTop + bubblePos.triggerHeight + 8,
                              left: bubblePos.triggerLeft,
                              minWidth: bubblePos.triggerWidth,
                            }
                          : {
                              top: bubblePos.cardCenterY - 72,
                              left: bubblePos.cardRight + 12,
                            }),
                      }}
                    >
                      {BUBBLE_ITEMS.map((b, i) => {
                        const isExiting = exiting === b.value || exiting === "__all__";
                        return (
                          <div
                            key={b.value}
                            data-bubble
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isExiting) selectBubble(b.value);
                            }}
                            style={{
                              animationDelay: isExiting ? "0ms" : `${i * 60}ms`,
                            }}
                            className={cn(
                              "pointer-events-auto select-none cursor-pointer",
                              "rounded-xl px-4 py-2.5",
                              "bg-[rgba(255,255,255,0.95)] dark:bg-[rgba(28,28,30,0.95)]",
                              "border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]",
                              "shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.06)]",
                              "transition-all duration-150",
                              "hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)]",
                              isExiting
                                ? "animate-bubble-out"
                                : "animate-bubble-in",
                            )}
                          >
                            <span className="font-sans text-sm font-semibold tracking-tight whitespace-nowrap text-gray-900 dark:text-gray-100">
                              {b.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>,
              document.body
            )}

          {/* ── Password ── */}
          <label
            className="block text-[0.65rem] font-semibold uppercase tracking-[0.13em] mb-2"
            style={{ color: "var(--text-tertiary)" }}
            htmlFor="gate-password"
          >
            Contraseña
          </label>
          <div
            className="relative rounded-xl overflow-hidden mb-5"
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

            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 disabled:opacity-30"
              style={{
                background: "var(--accent-muted)",
                border: "1px solid var(--border-accent)",
                boxShadow: showPassword
                  ? "inset 1px 1px 3px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)"
                  : "1px 1px 3px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)",
              }}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>

          {/* ── Error ── */}
          <div
            className="text-xs font-medium min-h-[1.25rem] transition-opacity"
            style={{
              color: "var(--danger)",
              opacity: error ? 1 : 0,
            }}
          >
            {error || "\u00A0"}
          </div>

          {/* ── Enter button ── */}
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
          >
            {submitting ? "Verificando\u2026" : "Entrar"}
          </button>
        </form>

        <div
          className="mt-8 text-center text-[0.6rem] uppercase tracking-[0.15em]"
          style={{ color: "var(--text-disabled)" }}
        >
          SENA — Gestión CMDB
        </div>
      </div>
    </div>
  );
}
