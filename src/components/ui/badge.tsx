import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // Typographic, not colored: editorial hierarchy via spacing, weight, and tracking.
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-display-loose transition-colors duration-200',
  {
    variants: {
      variant: {
        default:
          'text-foreground bg-surface-elevated border border-border-default',
        secondary:
          'text-muted-foreground bg-surface-elevated border border-border-default',
        blue: 'text-mode-blue bg-mode-blue-soft border border-mode-blue/30',
        destructive:
          'text-danger bg-danger-soft border border-danger/30',
        success:
          'text-success bg-success-soft border border-success/30',
        outline: 'text-foreground border border-border-default',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof badgeVariants> {}

function Badge ({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
