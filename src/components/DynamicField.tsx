'use client';

import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/CustomSelect';
import { DateField } from '@/components/DateField';

interface DynamicFieldProps {
  index: number;
  nombre: string;
  value: string;
  validacionesIndices: number[];
  validaciones: Record<number, string[]>;
  readOnly?: boolean;
  fieldId?: string;
  onChange: (index: number, value: string) => void;
}

export function DynamicField ({
  index,
  nombre,
  value,
  validacionesIndices,
  validaciones,
  readOnly,
  fieldId,
  onChange,
}: DynamicFieldProps) {
  const isObservaciones = nombre === 'Observaciones';
  const isDate = index === 47 || index === 48;
  const isSelect = validacionesIndices.includes(index) && index !== 6;
  const isPlaca = index === 6;

  const handleChange = (newValue: string) => {
    let val = newValue;
    if (typeof val === 'string') {
      val = isObservaciones ? val.replace(/'/g, '-') : val.replace(/'/g, '-').toUpperCase();
    }
    onChange(index, val);
  };

  if (isSelect) {
    return (
      <CustomSelect
        options={validaciones[index] || []}
        value={value || ''}
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
        id={fieldId}
        rows={3}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        className='flex w-full rounded-xl border border-border-default bg-surface-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground-60 shadow-neu-pressed hover:border-border-hover focus:border-accent focus:shadow-[var(--focus-ring)] focus:outline-none transition-all duration-200 ease-cinematic font-sans resize-vertical min-h-[90px] leading-relaxed'
      />
    );
  }

  return (
    <input
      id={fieldId}
      type='text'
      value={value || ''}
      readOnly={readOnly || isPlaca}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(
        'flex w-full rounded-xl border border-border-default bg-surface-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground-60 shadow-neu-pressed hover:border-border-hover focus:border-accent focus:shadow-[var(--focus-ring)] focus:outline-none transition-all duration-200 ease-cinematic font-sans',
        isPlaca && 'bg-surface-elevated text-muted-foreground font-semibold cursor-not-allowed border-dashed shadow-none'
      )}
    />
  );
}
