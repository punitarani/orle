'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const messageVariants = cva('flex gap-3', {
  variants: {
    from: {
      user: 'flex-row-reverse',
      assistant: 'flex-row',
    },
  },
  defaultVariants: {
    from: 'assistant',
  },
});

const messageContentVariants = cva('rounded-lg px-4 py-3 text-sm', {
  variants: {
    from: {
      user: 'bg-primary text-primary-foreground',
      assistant: 'bg-muted',
    },
  },
  defaultVariants: {
    from: 'assistant',
  },
});

interface MessageProps
  extends ComponentProps<'div'>,
    VariantProps<typeof messageVariants> {}

export function Message({ from, className, children, ...props }: MessageProps) {
  return (
    <div className={cn(messageVariants({ from }), className)} {...props}>
      {children}
    </div>
  );
}

interface MessageContentProps
  extends ComponentProps<'div'>,
    VariantProps<typeof messageContentVariants> {}

export function MessageContent({
  from,
  className,
  children,
  ...props
}: MessageContentProps) {
  return (
    <div
      className={cn(messageContentVariants({ from }), 'max-w-[85%]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface MessageResponseProps extends ComponentProps<'div'> {}

export function MessageResponse({
  className,
  children,
  ...props
}: MessageResponseProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)} {...props}>
      {children}
    </div>
  );
}

interface MessageActionsProps extends ComponentProps<'div'> {}

export function MessageActions({ className, children, ...props }: MessageActionsProps) {
  return (
    <div
      className={cn('flex items-center gap-1 mt-2', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface MessageActionProps extends ComponentProps<typeof Button> {
  tooltip?: string;
  label?: string;
}

export function MessageAction({
  tooltip,
  label,
  className,
  children,
  ...props
}: MessageActionProps) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-7 px-2 text-muted-foreground hover:text-foreground', className)}
      {...props}
    >
      {children}
      {label && <span className="ml-1.5 text-xs">{label}</span>}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

interface MessageAttachmentsProps extends ComponentProps<'div'> {}

export function MessageAttachments({
  className,
  children,
  ...props
}: MessageAttachmentsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} {...props}>
      {children}
    </div>
  );
}

interface MessageAttachmentProps extends ComponentProps<'div'> {
  data: { url?: string; name?: string };
}

export function MessageAttachment({
  data,
  className,
  ...props
}: MessageAttachmentProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm',
        className
      )}
      {...props}
    >
      <span className="truncate max-w-[200px]">{data.name || 'Attachment'}</span>
    </div>
  );
}

