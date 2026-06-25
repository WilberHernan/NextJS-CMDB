'use client';

import { cn } from '@/lib/utils';
import {
  formControlBase,
  formControlFocus,
  formControlReadOnly,
} from '@/lib/form-styles';
import { CustomSelect } from '@/components/CustomSelect';
import { DateField } from '@/components/DateField';
import { Input } from '@/components/ui/input';

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
    return <DateField value={value} onChange={handleChange} id={fieldId} />;
  }

  if (isObservaciones) {
    return (
      <textarea
        id={fieldId}
        rows={3}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          formControlBase,
          formControlFocus,
          'resize-vertical min-h-[90px] leading-relaxed'
        )}
      />
    );
  }

  return (
    <Input
      id={fieldId}
      type='text'
      value={value || ''}
      readOnly={readOnly || isPlaca}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(isPlaca && formControlReadOnly)}
    />
  );
}
