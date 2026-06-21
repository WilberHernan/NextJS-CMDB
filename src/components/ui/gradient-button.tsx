'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * GradientButton — Reusable button with animated gradient border.
 *
 * Variants:
 *  - primary: solid filled with accent gradient (for main actions like Save)
 *  - secondary: subtle glass-morphism style (for camera/secondary actions)
 *  - icon: icon-only round button
 */
const gradientButtonVariants = cva(
  [
    // Base wrapper styles
    'relative inline-block p-[3px] rounded-[20px]',
    'bg-[linear-gradient(60deg,var(--accent),var(--sena-green-light),var(--accent))]',
    'bg-[length:400%_400%] animate-gradient-shift',
    'opacity-85',
    'transition-all duration-200',
    'shadow-[var(--shadow-button)]',
    'outline-none',
    'cursor-pointer',
    // Hover state
    'hover:opacity-100 hover:duration-300 hover:-translate-y-0.5',
    'hover:shadow-[var(--shadow-button-hover),0_0_0_1px_var(--border-accent)]',
    // Active state
    'active:translate-y-0 active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: '',
        secondary: '',
        icon: 'rounded-full p-[2px]',
      },
      disabled: {
        true: 'opacity-40 cursor-not-allowed animate-none hover:translate-y-0 hover:shadow-[var(--shadow-button)]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      disabled: false,
    },
  }
);

const gradientButtonInnerVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2.5',
    'bg-[var(--bg-base)] text-[var(--text-primary)]',
    'border-none rounded-[17px]',
    'font-bold tracking-[0.02em] font-sans',
    'transition-all duration-200',
    'outline-none',
    'shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-[0.9375rem]',
        lg: 'px-11 py-4 text-base',
        icon: 'w-11 h-11 p-0 rounded-full',
      },
      variant: {
        primary: 'hover:bg-[var(--bg-surface)]',
        secondary: 'hover:bg-[var(--bg-surface)]',
        icon: 'hover:bg-[var(--bg-surface)]',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
);

export interface GradientButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
  VariantProps<typeof gradientButtonVariants>,
  VariantProps<typeof gradientButtonInnerVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      icon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const Comp = asChild ? Slot : 'button';

    return (
      <span
        className={cn(
          gradientButtonVariants({
            variant,
            disabled: isDisabled,
          }),
          className
        )}
      >
        <Comp
          ref={ref}
          type={asChild ? undefined : type}
          disabled={isDisabled}
          className={cn(gradientButtonInnerVariants({ size, variant }))}
          {...props}
        >
          {loading
            ? (
              <svg
                className='animate-spin h-4 w-4'
                viewBox='0 0 24 24'
                fill='none'
                aria-hidden='true'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              )
            : (
                icon
              )}
          {children}
        </Comp>
      </span>
    );
  }
);
GradientButton.displayName = 'GradientButton';

export { GradientButton, gradientButtonVariants };
