"use client";

import { useRef, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import senaLogo from "@/Img/logoSena.png";

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
              src={senaLogo.src}
              alt="SENA"
              className="w-8 h-8 object-contain block"
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
