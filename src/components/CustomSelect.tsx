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
      className={cn("group relative w-full", className)}
    >
      {/* Gradient border glow — matches CMDB_SENA .custom-select::before */}
      <div
        className={cn(
          "absolute inset-[-2px] rounded-[16px] opacity-0 transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-r from-accent via-sena-green-light to-accent bg-[length:400%_400%] animate-gradient-shift",
          "group-hover:opacity-20",
          open && "opacity-30"
        )}
        style={{ filter: "blur(8px)", zIndex: -1 }}
      />

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[12px] bg-surface-base px-4 py-3 text-sm text-left text-foreground relative",
          "border border-border-subtle transition-all duration-200 outline-none font-sans",
          "hover:border-border-default hover:bg-surface focus:border-accent",
          "shadow-neu-pressed",
          open && "border-accent"
        )}
      >
        <span className={cn("truncate", !value && "text-tertiary")}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-tertiary transition-transform duration-200",
            open && "rotate-180 text-accent"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-[calc(100%+12px)] left-0 right-0 z-50",
            "rounded-[20px] border",
            "p-2 max-h-[300px] overflow-y-auto",
            "animate-scale-in origin-top"
          )}
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            borderColor: "var(--glass-border)",
            boxShadow:
              "0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 var(--glass-highlight)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-left",
                "transition-all duration-150",
                "text-muted-foreground",
                "hover:bg-surface-hover hover:text-foreground",
                "hover:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)]",
                "mb-0.5 last:mb-0",
                opt === value &&
                  "bg-accent-soft text-accent font-semibold border border-border-accent"
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
