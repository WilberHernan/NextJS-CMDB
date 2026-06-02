"use client";

import { Search, Plus, HelpCircle } from "lucide-react";

interface EmptyStateProps {
  placa: string;
  onRetry: () => void;
  onRegisterNew: () => void;
}

export function EmptyState({ placa, onRetry, onRegisterNew }: EmptyStateProps) {
  return (
    <div className="relative max-w-[520px] mx-auto my-8 p-12 sm:p-10 text-center rounded-2xl glass border-border-default overflow-hidden animate-empty-state-in">
      {/* Radial gradient background glow */}
      <div
        className="absolute -top-[40%] -left-[40%] w-[180%] h-[180%] pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 45%, var(--warning-soft) 0%, transparent 55%)" }}
        aria-hidden="true"
      />

      {/* Icon visual */}
      <div className="mb-7 flex justify-center animate-empty-state-float [animation-delay:0.3s]">
        <div className="relative w-[116px] h-[116px] rounded-full flex items-center justify-center bg-gradient-to-br from-surface-elevated to-surface-base shadow-neu-flat">
          <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center bg-[linear-gradient(135deg,var(--warning-soft),transparent_70%)] text-warning">
            <Search className="h-9 w-9" strokeWidth={1.8} />
          </div>
          <div className="absolute bottom-1 right-1 w-[34px] h-[34px] rounded-full flex items-center justify-center bg-warning text-surface-base border-[3px] border-surface-base shadow-[0_4px_14px_var(--warning-soft)] animate-empty-state-badge-in [animation-delay:0.5s] opacity-0 scale-0">
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Title */}
      <h2 className="font-display text-[1.5rem] sm:text-[1.625rem] font-semibold tracking-display-tight mb-2.5 text-foreground text-balance animate-empty-state-child-in [animation-delay:0.15s] opacity-0 translate-y-2">
        Equipo no encontrado
      </h2>

      {/* Description */}
      <p className="text-[0.9375rem] text-muted-foreground leading-relaxed max-w-[360px] mx-auto mb-7 animate-empty-state-child-in [animation-delay:0.25s] opacity-0 translate-y-2">
        La placa{" "}
        <span className="inline-block font-mono text-[0.8125rem] font-semibold px-2.5 py-1 mx-0.5 rounded-md bg-surface-elevated text-foreground border border-border-default shadow-neu-pressed align-middle">
          {placa}
        </span>{" "}
        no existe en la base de datos.
        <br />
        Verificá que esté bien escaneada o registrá el equipo como nuevo.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 animate-empty-state-child-in [animation-delay:0.4s] opacity-0 translate-y-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[0.9375rem] font-semibold text-muted-foreground bg-surface-elevated border border-border-default shadow-neu hover:-translate-y-0.5 hover:shadow-neu-flat hover:text-foreground active:translate-y-0 active:shadow-neu-pressed transition-all duration-200 ease-cinematic outline-none font-sans"
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={2} />
          Escanear otra placa
        </button>
        <button
          type="button"
          onClick={onRegisterNew}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[0.9375rem] font-semibold text-white bg-[linear-gradient(135deg,var(--sena-green),var(--accent-hover))] border border-transparent shadow-[0_4px_16px_var(--sena-green-glow)] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_var(--sena-green-glow)] active:translate-y-0 active:scale-[0.98] active:shadow-[0_2px_8px_var(--sena-green-glow)] transition-all duration-200 ease-cinematic outline-none font-sans"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
          Registrar nuevo
        </button>
      </div>
    </div>
  );
}
