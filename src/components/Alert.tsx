"use client";

import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  className?: string;
}

// One source of color per alert: the icon. The rest is typographic.
const config = {
  success: { Icon: CheckCircle, colorVar: "var(--success)" },
  error: { Icon: XCircle, colorVar: "var(--danger)" },
  info: { Icon: Info, colorVar: "var(--info)" },
  warning: { Icon: AlertCircle, colorVar: "var(--warning)" },
} as const;

export function Alert({ type, message, className }: AlertProps) {
  const { Icon, colorVar } = config[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 w-full",
        "rounded-2xl border border-border-default bg-surface-elevated",
        "px-4 py-3.5 text-sm font-medium text-foreground",
        "shadow-neu-flat",
        "animate-slide-down",
        className
      )}
    >
      <Icon
        className="h-[18px] w-[18px] shrink-0"
        strokeWidth={2.25}
        style={{ color: colorVar }}
        aria-hidden
      />
      <span className="flex-1 leading-relaxed text-pretty">{message}</span>
    </div>
  );
}
