"use client";

import { CustomSelect } from "@/components/CustomSelect";
import { DateField } from "@/components/DateField";

interface DynamicFieldProps {
  index: number;
  nombre: string;
  value: string;
  validacionesIndices: number[];
  validaciones: Record<number, string[]>;
  readOnly?: boolean;
  onChange: (index: number, value: string) => void;
}

export function DynamicField({
  index,
  nombre,
  value,
  validacionesIndices,
  validaciones,
  readOnly,
  onChange,
}: DynamicFieldProps) {
  const isObservaciones = nombre === "Observaciones";
  const isDate = index === 47 || index === 48;
  const isSelect = validacionesIndices.includes(index) && index !== 6;
  const isPlaca = index === 6;
  const isFullWidth = isObservaciones;

  const handleChange = (newValue: string) => {
    let val = newValue;
    if (typeof val === "string") {
      val = val.replace(/'/g, "-").toUpperCase();
    }
    onChange(index, val);
  };

  if (isSelect) {
    return (
      <CustomSelect
        options={validaciones[index] || []}
        value={value || ""}
        onChange={handleChange}
      />
    );
  }

  if (isDate) {
    return <DateField value={value} onChange={handleChange} />;
  }

  if (isObservaciones) {
    return (
      <textarea
        rows={3}
        value={value || ""}
        onChange={(e) => handleChange(e.target.value)}
        className="flex w-full rounded-[12px] border border-border-subtle bg-surface-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground-60 shadow-neu-pressed hover:border-border-default focus:border-accent focus:shadow-[0_0_0_3px_rgba(74,222,128,0.1)] focus:outline-none transition-all duration-200 font-sans resize-vertical min-h-[90px] leading-relaxed"
      />
    );
  }

  return (
    <input
      type="text"
      value={value || ""}
      readOnly={readOnly || isPlaca}
      onChange={(e) => handleChange(e.target.value)}
      className={`flex w-full rounded-[12px] border border-border-subtle bg-surface-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground-60 shadow-neu-pressed hover:border-border-default focus:border-accent focus:shadow-[0_0_0_3px_rgba(74,222,128,0.1)] focus:outline-none transition-all duration-200 font-sans ${isPlaca ? "bg-surface-elevated text-muted-foreground font-semibold font-mono cursor-not-allowed border-dashed shadow-none" : ""}`}
    />
  );
}
