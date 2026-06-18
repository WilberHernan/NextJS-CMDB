import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-50 disabled:pointer-events-none disabled:opacity-50 font-sans',
  {
    variants: {
      variant: {
        default:
          'bg-accent-soft text-accent border border-border-accent shadow-neu-pressed hover:-translate-y-0.5 hover:shadow-neu-flat active:translate-y-0 active:shadow-neu-pressed',
        secondary:
          'bg-surface-elevated text-foreground border border-border-default shadow-neu hover:border-border-hover hover:-translate-y-0.5 active:translate-y-0',
        ghost:
          'bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface-hover',
        destructive:
          'bg-danger-soft text-danger border border-danger-soft/30 hover:bg-danger-soft/60',
        outline:
          'border border-border-default bg-transparent hover:bg-surface-hover hover:border-border-hover',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
