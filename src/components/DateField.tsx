'use client';

import { useRef, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { cn, formatearFechaParaInput } from '@/lib/utils';
import {
  formControlBase,
  formControlFocusWithin,
} from '@/lib/form-styles';

interface DateFieldProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export function DateField ({ value, onChange, className, id }: DateFieldProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleWrapperClick = useCallback(() => {
    dateInputRef.current?.click();
  }, []);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
        const d = new Date(e.target.value + 'T00:00:00');
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        onChange(`${dd}/${mm}/${yyyy}`);
      } else {
        onChange('');
      }
    },
    [onChange]
  );

  const isoValue = formatearFechaParaInput(value || '');

  return (
    <div
      onClick={handleWrapperClick}
      className={cn(
        formControlBase,
        formControlFocusWithin,
        'group relative items-center cursor-pointer',
        className
      )}
    >
      <input
        id={id}
        type='text'
        readOnly
        value={value || ''}
        placeholder='DD/MM/AAAA'
        className='w-full bg-transparent outline-none cursor-pointer placeholder:text-muted-foreground-60'
      />
      <input
        ref={dateInputRef}
        type='date'
        value={isoValue}
        onChange={handleDateChange}
        className='absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer border-none bg-transparent text-transparent'
        tabIndex={-1}
        aria-hidden
      />
      <Calendar className='mr-3 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none transition-colors duration-200 group-hover:text-accent group-focus-within:text-accent' />
    </div>
  );
}
