"use client";

import { useRef, useCallback } from "react";
import { Calendar } from "lucide-react";
import { formatearFechaParaInput } from "@/lib/utils";

interface DateFieldProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateField({ value, onChange, className }: DateFieldProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleWrapperClick = useCallback(() => {
    dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click();
  }, []);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
        const d = new Date(e.target.value + "T00:00:00");
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        onChange(`${dd}/${mm}/${yyyy}`);
      } else {
        onChange("");
      }
    },
    [onChange]
  );

  const isoValue = formatearFechaParaInput(value || "");

  return (
    <div
      onClick={handleWrapperClick}
      className={`group relative w-full rounded-xl p-[1px] cursor-pointer transition-all duration-200 bg-border-default hover:bg-border-hover focus-within:bg-accent/30 ${className ?? ""}`}
    >
      {/* Gradient border glow */}
      <div
        className="absolute inset-[-1px] rounded-[13px] opacity-0 group-hover:opacity-30 focus-within:opacity-40 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-accent via-sena-green-light to-accent bg-[length:400%_400%] animate-gradient-shift"
        style={{ filter: "blur(4px)", zIndex: -1 }}
      />

      <div className="flex items-center rounded-[11px] bg-surface-input shadow-neu-pressed relative">
        <input
          type="text"
          readOnly
          value={value || ""}
          placeholder="DD/MM/AAAA"
          className="w-full rounded-[11px] bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 cursor-pointer outline-none font-sans"
        />
        <input
          ref={dateInputRef}
          type="date"
          value={isoValue}
          onChange={handleDateChange}
          className="absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer border-none bg-transparent text-transparent"
        />
        <Calendar className="mr-3 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none transition-colors duration-300 group-hover:text-accent" />
      </div>
    </div>
  );
}
