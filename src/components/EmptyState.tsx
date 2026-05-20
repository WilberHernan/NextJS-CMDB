"use client";

import { Search, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  placa: string;
  onRetry: () => void;
  onRegisterNew: () => void;
}

export function EmptyState({ placa, onRetry, onRegisterNew }: EmptyStateProps) {
  return (
    <div className="max-w-lg mx-auto mt-8 p-8 sm:p-12 text-center rounded-3xl glass border border-border-default animate-scale-in relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-amber-500/5 to-transparent pointer-events-none" />

      <div className="relative mb-7 flex justify-center">
        <div className="w-[116px] h-[116px] rounded-full flex items-center justify-center bg-surface-elevated shadow-neu-flat">
          <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center bg-amber-500/10 text-amber-400">
            <Search className="h-8 w-8 stroke-[1.8]" />
          </div>
        </div>
        <div className="absolute bottom-1 right-1 w-[34px] h-[34px] rounded-full bg-amber-400 text-surface-base flex items-center justify-center shadow-lg border-[3px] border-surface-base">
          <HelpCircle className="h-[18px] w-[18px] stroke-[2.5]" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2.5 tracking-tight">
        Equipo no encontrado
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto mb-7">
        La placa{" "}
        <span className="inline-block font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-elevated text-foreground border border-border-default shadow-neu-pressed align-middle">
          {placa}
        </span>{" "}
        no existe en la base de datos.
        <br />
        Verificá que esté bien escaneada o registrá el equipo como nuevo.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="secondary" onClick={onRetry}>
          <Search className="h-4 w-4" />
          Escanear otra placa
        </Button>
        <Button onClick={onRegisterNew}>
          <Plus className="h-4 w-4" />
          Registrar nuevo
        </Button>
      </div>
    </div>
  );
}
