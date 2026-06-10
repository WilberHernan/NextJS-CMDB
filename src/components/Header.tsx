"use client";

import { useRef, useEffect, useState } from "react";
import { Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSede } from "@/contexts/sede-context";
import { SEDE_LABELS } from "@/lib/sedes";
import senaLogo from "@/app/icon.png";

interface HeaderProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  /**
   * Briefly highlights the header with a directional SENA-green gradient bar.
   * Set true on a meaningful success (equipment found, save confirmed).
   * The bar fades automatically — it never loops, never stays permanent.
   */
  highlightSuccess?: boolean;
}

export function Header({
  theme,
  onToggleTheme,
  highlightSuccess = false,
}: HeaderProps) {
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { sede } = useSede();

  useEffect(() => {
    document.title = sede
      ? `CMDB SENA ${SEDE_LABELS[sede]} — Cauca 2026`
      : "CMDB — SENA CCYS";
  }, [sede]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const header = headerRef.current;
    if (!sentinel || !header) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: [1] }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Si falla el fetch, igual recargamos — la cookie se borrará al recargar
    }
    window.location.reload();
  };

  return (
    <>
      {/* Sticky sentinel */}
      <div
        ref={sentinelRef}
        style={{ position: "absolute", top: 0, height: 1, visibility: "hidden", pointerEvents: "none" }}
      />

      <header
        ref={headerRef}
        className={cn(
          "sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3.5",
          "rounded-2xl glass border-border-default",
          "transition-all duration-350",
          stuck && "rounded-b-[18px] rounded-t-none shadow-[var(--shadow-md)] border-border-hover"
        )}
        style={
          stuck
            ? { backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)" }
            : undefined
        }
      >
        <div className="flex items-center gap-3.5">
          <img
            src={senaLogo.src}
            alt="SENA"
            className="w-9 h-9 object-contain block shrink-0"
          />
          <div>
            <div
              className="text-[1.05rem] font-bold tracking-[-0.02em] leading-tight text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              SENA {sede ? SEDE_LABELS[sede] : "CCYS"}
            </div>
            <div className="text-[0.6875rem] font-medium uppercase tracking-display-loose text-muted-foreground">
              Gestión CMDB
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-border-default">
            <span className="w-[6px] h-[6px] rounded-full bg-accent dark:animate-none animate-pulse-glow" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">
              Activa
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="rounded-xl"
            title="Cambiar tema"
          >
            {theme === "dark" ? (
              <Moon className="h-[18px] w-[18px]" />
            ) : (
              <Sun className="h-[18px] w-[18px]" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="rounded-xl"
            title="Salir"
          >
            <LogOut className="h-[18px] w-[18px] text-muted-foreground hover:text-danger transition-colors duration-200" />
          </Button>
        </div>

        {/* Bottom highlight bar — only mounted when a success event is active.
            Uses the SENA green as a directional gradient (#39a900 → #4ade80 → #39a900),
            not a flat color, so it reads as a cinematic accent, not decoration. */}
        {highlightSuccess && (
          <span
            key={highlightSuccess ? "on" : "off"}
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 bottom-0 h-[1.5px] rounded-b-2xl animate-success-bar"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #39a900 18%, #4ade80 50%, #39a900 82%, transparent 100%)",
            }}
          />
        )}
      </header>
    </>
  );
}
