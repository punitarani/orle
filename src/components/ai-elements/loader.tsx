'use client';

import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

interface LoaderProps extends ComponentProps<'div'> {
  size?: number;
}

export function Loader({ size = 16, className, ...props }: LoaderProps) {
  return (
    <div
      className={cn('flex items-center gap-1', className)}
      {...props}
    >
      <span
        className="animate-bounce rounded-full bg-current"
        style={{
          width: size / 3,
          height: size / 3,
          animationDelay: '0ms',
        }}
      />
      <span
        className="animate-bounce rounded-full bg-current"
        style={{
          width: size / 3,
          height: size / 3,
          animationDelay: '150ms',
        }}
      />
      <span
        className="animate-bounce rounded-full bg-current"
        style={{
          width: size / 3,
          height: size / 3,
          animationDelay: '300ms',
        }}
      />
    </div>
  );
}

