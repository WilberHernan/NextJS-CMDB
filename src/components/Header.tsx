"use client";

import { useRef, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SENA_LOGO =
  "data:image/png;base64,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";

interface HeaderProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

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
          stuck && "rounded-b-[18px] rounded-t-none shadow-[0_8px_32px_rgba(0,0,0,0.35)] border-border-hover"
        )}
        style={
          stuck
            ? { backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)" }
            : undefined
        }
      >
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-sena-green to-accent shadow-lg shadow-sena-glow">
            <img
              src={SENA_LOGO}
              alt="SENA"
              className="w-8 h-8 object-contain block brightness-0 invert"
            />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight leading-tight text-foreground">
              SENA CCYS
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              Gestión CMDB
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-border-default">
            <span className="w-[6px] h-[6px] rounded-full bg-accent animate-pulse-glow" />
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
        </div>
      </header>
    </>
  );
}
