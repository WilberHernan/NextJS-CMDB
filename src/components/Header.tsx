"use client";

import { Sun, Moon, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3.5",
        "rounded-2xl glass border-border-default",
        "transition-all duration-350"
      )}
    >
      <div className="flex items-center gap-3.5">
        <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-sena-green to-accent shadow-lg shadow-sena-glow">
          <Cpu className="h-6 w-6 text-white" />
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
  );
}
