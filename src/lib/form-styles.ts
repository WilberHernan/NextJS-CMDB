import { cn } from '@/lib/utils';

/** Shared surface for inputs, selects, date fields and textareas */
export const formControlBase = cn(
  'flex w-full rounded-xl border border-border-default bg-surface-input',
  'px-4 py-3 text-sm text-foreground font-sans',
  'placeholder:text-muted-foreground-60',
  'shadow-neu-pressed',
  'hover:border-border-hover',
  'transition-all duration-200 ease-cinematic outline-none'
);

export const formControlFocus = 'focus:border-accent focus:shadow-[var(--focus-ring)]';
export const formControlFocusWithin = 'focus-within:border-accent focus-within:shadow-[var(--focus-ring)]';
export const formControlOpen = 'border-accent shadow-[var(--focus-ring)]';

export const formControlReadOnly = cn(
  'bg-surface-elevated text-muted-foreground font-semibold',
  'cursor-not-allowed border-dashed shadow-none'
);

/** Floating panel — matches header download menu */
export const formPanelClasses = cn(
  'pointer-events-auto p-1.5 max-h-[280px] overflow-y-auto overscroll-contain',
  'rounded-xl glass border border-border-default shadow-[var(--shadow-md)]',
  'animate-dropdown-in'
);

export const formOptionClasses = cn(
  'flex w-full items-center px-3 py-2.5 rounded-lg text-sm font-semibold text-left',
  'text-muted-foreground',
  'transition-all duration-200 ease-cinematic',
  'hover:bg-surface-hover hover:text-foreground',
  'active:scale-[0.98]'
);

export const formOptionSelectedClasses = 'bg-accent-soft text-accent';
