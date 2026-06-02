"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer";
}

export function Skeleton({ className, variant = "shimmer", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-surface-elevated",
        variant === "shimmer" && "animate-shimmer bg-gradient-to-r from-surface-elevated via-surface-hover to-surface-elevated bg-[length:200%_100%]",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
