"use client";

import { cn } from "@/lib/utils";

interface LoaderProps {
  message?: string;
  className?: string;
}

export function Loader({
  message = "Buscando en la base de datos...",
  className,
}: LoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 mt-5 text-sm text-muted-foreground font-medium animate-fade-in-up",
        className
      )}
    >
      <span className="relative block w-6 h-6 shrink-0">
        {/* Neumorphic base ring */}
        <span className="absolute inset-0 rounded-full shadow-neu-flat bg-surface-elevated border border-border-default" />
        {/* Orbiting accent dot */}
        <span className="absolute inset-0 animate-[neu-spin_1s_linear_infinite]">
          <span className="block w-[3px] h-[3px] rounded-full bg-accent mx-auto" />
        </span>
      </span>
      <span>{message}</span>
    </div>
  );
}
