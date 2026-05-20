"use client";

import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

interface LoaderProps {
  message?: string;
  className?: string;
}

export function Loader({
  message = "Buscando en la base de datos...",
  className,
}: LoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 mt-5 text-sm text-muted-foreground font-medium animate-fade-in-up",
        className
      )}
    >
      <LoaderIcon className="h-5 w-5 animate-spin text-accent" />
      <span>{message}</span>
    </div>
  );
}
