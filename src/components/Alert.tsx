'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  className?: string;
  /** Called after the alert auto-dismisses (success only, 3s).
   *  Parent should clear the alert info to unmount this component. */
  onDismiss?: () => void;
}

// One source of color per alert: the icon. The rest is typographic.
const config = {
  success: { Icon: CheckCircle, colorVar: 'var(--success)' },
  error: { Icon: XCircle, colorVar: 'var(--danger)' },
  info: { Icon: Info, colorVar: 'var(--info)' },
  warning: { Icon: AlertCircle, colorVar: 'var(--warning)' },
} as const;

export function Alert ({ type, message, className, onDismiss }: AlertProps) {
  const { Icon, colorVar } = config[type];
  const [dismissing, setDismissing] = useState(false);

  // Auto-dismiss success alerts after 3s
  useEffect(() => {
    if (type !== 'success' || !onDismiss) return;

    const timer = setTimeout(() => {
      setDismissing(true);
      // Wait for exit animation, THEN call onDismiss
      setTimeout(onDismiss, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [type, onDismiss]);

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn(
        'flex items-center gap-3 w-full',
        'rounded-2xl glass shadow-neu-flat',
        'px-4 py-3.5 text-sm font-medium text-foreground',
        dismissing ? 'animate-alert-out' : 'animate-alert-in',
        className
      )}
    >
      <Icon
        className='h-[18px] w-[18px] shrink-0'
        strokeWidth={2.25}
        style={{ color: colorVar }}
        aria-hidden
      />
      <span className='flex-1 leading-relaxed text-pretty'>{message}</span>
    </div>
  );
}
