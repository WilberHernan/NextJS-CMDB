"use client";

import React from "react";
import { FileText, Save, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicField } from "@/components/DynamicField";
import {
  COLUMNAS,
  SECCIONES,
} from "@/types/equipment";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "blue" | "secondary";

interface EquipmentFormProps {
  visible: boolean;
  esModoNuevo: boolean;
  hojaActual: string;
  filaActual: string;
  hojaBadgeText: string;
  hojaBadgeVariant: BadgeVariant;
  valores: string[];
  validaciones: Record<number, string[]>;
  validacionesIndices: number[];
  onValorChange: (index: number, value: string) => void;
  onGuardar: () => void;
  saving: boolean;
}

export function EquipmentForm({
  visible,
  esModoNuevo,
  hojaBadgeText,
  hojaBadgeVariant,
  valores,
  validaciones,
  validacionesIndices,
  onValorChange,
  onGuardar,
  saving,
}: EquipmentFormProps) {
  if (!visible) return null;

  return (
    <div className="animate-fade-in-up">
      <div className="rounded-3xl glass border-border-default p-6 sm:p-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-7 pb-5 border-b border-border-default">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2.5 tracking-tight">
            <FileText className="h-5 w-5" />
            Ficha del Equipo
          </h3>
          <Badge variant={hojaBadgeVariant}>
            {hojaBadgeText}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {COLUMNAS.map((nombre, index) => {
            const section = SECCIONES[index];
            const isObservaciones = nombre === "Observaciones";
            const isPlaca = index === 6;

            return (
              <React.Fragment key={index}>
                {section && (
                  <div className="col-span-full flex items-center gap-3 mt-2 mb-1 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                      {section}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-border-default to-transparent" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-1.5",
                    isObservaciones && "col-span-full"
                  )}
                >
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-bold rounded-md bg-surface-elevated text-muted-foreground border border-border-default font-mono">
                      {index + 1}
                    </span>
                    {nombre}
                  </label>

                  <DynamicField
                    index={index}
                    nombre={nombre}
                    value={valores[index] || ""}
                    validacionesIndices={validacionesIndices}
                    validaciones={validaciones}
                    readOnly={esModoNuevo && isPlaca}
                    onChange={onValorChange}
                  />
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-border-default flex justify-center">
          <Button
            size="lg"
            onClick={onGuardar}
            disabled={saving}
          >
            {esModoNuevo ? (
              <>
                <Sparkles className="h-4 w-4" />
                Registrar Nuevo Equipo
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Actualización
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
