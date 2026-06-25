'use client';

import React from 'react';
import { FileText, Save, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DynamicField } from '@/components/DynamicField';
import { COLUMNAS, SECCIONES } from '@/types/equipment';

type BadgeVariant = 'default' | 'blue' | 'secondary';

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

export function EquipmentForm ({
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
    <div className='animate-fade-in-up'>
      <div className='rounded-3xl glass border-border-default p-6 sm:p-8'>
        <div className='flex items-center justify-between flex-wrap gap-3 mb-7 pb-5 border-b border-border-default'>
          <h3
            className='uppercase text-[clamp(0.75rem,1.5vw,0.95rem)] font-medium tracking-[0.28em] text-muted-foreground flex items-center gap-2'
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <FileText className='h-[14px] w-[14px] text-muted-foreground/60' strokeWidth={1.75} />
            Ficha del Equipo
          </h3>
          <Badge variant={hojaBadgeVariant}>
            {hojaBadgeText}
          </Badge>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]'>
          {COLUMNAS.map((nombre, index) => {
            const section = SECCIONES[index];
            const isObservaciones = nombre === 'Observaciones';
            const isPlaca = index === 6;

            return (
              <React.Fragment key={index}>
                {section && (
                  <div className='col-span-full flex items-baseline gap-3 mt-4 mb-1 pb-2 first:mt-0'>
                    <span className='text-[0.6875rem] font-semibold uppercase tracking-display-loose text-muted-foreground whitespace-nowrap'>
                      {section}
                    </span>
                    <div className='flex-1 h-px bg-gradient-to-r from-border-default to-transparent' />
                  </div>
                )}

                <div
                  className={cn(
                    'flex flex-col gap-1.5',
                    isObservaciones && 'col-span-full'
                  )}
                >
                  <label htmlFor={`field-${index}`} className='text-[0.6875rem] font-semibold uppercase tracking-display-loose text-muted-foreground flex items-center gap-2'>
                    <span className='inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-semibold rounded-md bg-surface-elevated text-muted-foreground border border-border-default font-mono'>
                      {index + 1}
                    </span>
                    {nombre}
                  </label>

                  <DynamicField
                    index={index}
                    nombre={nombre}
                    value={valores[index] || ''}
                    validacionesIndices={validacionesIndices}
                    validaciones={validaciones}
                    readOnly={esModoNuevo && isPlaca}
                    fieldId={`field-${index}`}
                    onChange={onValorChange}
                  />
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className='mt-8 pt-6 border-t border-border-default flex justify-center'>
          <button
            type='button'
            onClick={onGuardar}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold',
              'transition-all duration-200 ease-cinematic outline-none',
              'shadow-neu border shadow-neu-pressed',
              'hover:-translate-y-0.5 hover:shadow-neu-flat',
              'active:translate-y-0 active:shadow-neu-pressed',
              saving && 'opacity-60 pointer-events-none',
              esModoNuevo
                ? 'bg-info-soft text-foreground border-info'
                : 'bg-accent-soft text-foreground border-border-accent'
            )}
          >
            {saving
              ? (
                <div className='h-4 w-4 rounded-full border-2 border-accent-soft border-t-accent animate-spin' />
                )
              : esModoNuevo
                ? (
                  <Sparkles className='h-4 w-4' />
                  )
                : (
                  <Save className='h-4 w-4' />
                  )}
            {saving ? 'Guardando…' : esModoNuevo ? 'Registrar Nuevo Equipo' : 'Guardar Actualización'}
          </button>
        </div>
      </div>
    </div>
  );
}
