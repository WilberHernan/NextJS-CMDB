"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface CustomSelectProps {
  options: string[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CustomSelect({
  options,
  value,
  placeholder = "Seleccione...",
  onChange,
  className,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (opt: string) => {
      onChange(opt);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative w-full rounded-xl p-[1px] transition-all duration-200",
        "bg-border-default hover:bg-border-hover",
        open && "bg-accent/30",
        className
      )}
    >
      {/* Gradient border glow */}
      <div
        className={cn(
          "absolute inset-[-1px] rounded-[13px] opacity-0 transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-r from-accent via-sena-green-light to-accent bg-[length:400%_400%] animate-gradient-shift",
          open && "opacity-40"
        )}
        style={{ filter: "blur(4px)", zIndex: -1 }}
      />

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[11px] bg-surface-input px-4 py-3 text-sm text-left relative",
          "shadow-neu-pressed transition-all duration-200 outline-none font-sans",
          open && "shadow-neu-pressed"
        )}
      >
        <span
          className={cn(
            "truncate",
            !value && "text-muted-foreground/60"
          )}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-accent"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-[calc(100%+8px)] left-0 right-0 z-50",
            "rounded-2xl border border-border-default bg-surface/95 backdrop-blur-xl",
            "shadow-2xl shadow-black/40",
            "py-2 px-2 max-h-[280px] overflow-y-auto",
            "animate-scale-in origin-top"
          )}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-left",
                "transition-all duration-150",
                "hover:bg-surface-hover hover:text-foreground",
                opt === value &&
                  "bg-accent/10 text-accent font-semibold border border-accent/25"
              )}
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0 transition-opacity",
                  opt === value ? "opacity-100" : "opacity-0"
                )}
              />
              <span>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
