import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold font-mono transition-colors duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-accent/10 text-accent border border-accent/25",
        secondary:
          "bg-surface-elevated text-muted-foreground border border-border-default",
        blue: "bg-blue-500/10 text-blue-400 border border-blue-500/25",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/25",
        success:
          "bg-green-500/10 text-green-400 border border-green-500/25",
        outline: "border border-border-default text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
