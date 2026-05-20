"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface AlertProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  className?: string;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const styles = {
  success:
    "bg-green-500/10 text-green-400 border-green-500/20",
  error:
    "bg-red-500/10 text-red-400 border-red-500/20",
  info:
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warning:
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export function Alert({ type, message, className }: AlertProps) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 w-full rounded-2xl border px-4 py-3.5 text-sm font-medium animate-slide-down",
        styles[type],
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
