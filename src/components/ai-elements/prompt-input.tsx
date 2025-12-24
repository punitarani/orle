'use client';

import { cn } from '@/lib/utils';
import { ArrowUp, Loader2, Square } from 'lucide-react';
import type { ComponentProps, FormEvent } from 'react';
import { createContext, useContext, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PromptInputContextType {
  value: string;
  setValue: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const PromptInputContext = createContext<PromptInputContextType | null>(null);

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error('usePromptInput must be used within a PromptInput');
  }
  return context;
}

interface PromptInputProps extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  onSubmit?: (message: { text: string }) => void | Promise<void>;
  disabled?: boolean;
}

export function PromptInput({
  onSubmit,
  disabled,
  className,
  children,
  ...props
}: PromptInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (value.trim() && onSubmit) {
      onSubmit({ text: value });
      setValue('');
    }
  };

  return (
    <PromptInputContext.Provider
      value={{ value, setValue, onSubmit: handleSubmit, disabled }}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          'relative flex items-end gap-2 rounded-lg border bg-background p-2',
          className
        )}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
}

interface PromptInputTextareaProps extends Omit<ComponentProps<typeof Textarea>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function PromptInputTextarea({
  value: controlledValue,
  onChange: controlledOnChange,
  className,
  onKeyDown,
  ...props
}: PromptInputTextareaProps) {
  const context = usePromptInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const value = controlledValue ?? context.value;
  const onChange = controlledOnChange ?? ((e: React.ChangeEvent<HTMLTextAreaElement>) => context.setValue(e.target.value));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      context.onSubmit();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      disabled={context.disabled}
      rows={1}
      className={cn(
        'min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0',
        className
      )}
      {...props}
    />
  );
}

interface PromptInputSubmitProps extends ComponentProps<typeof Button> {
  status?: 'ready' | 'streaming' | 'disabled';
}

export function PromptInputSubmit({
  status = 'ready',
  className,
  disabled,
  ...props
}: PromptInputSubmitProps) {
  const context = usePromptInput();
  const isDisabled = disabled ?? context.disabled ?? !context.value.trim();

  return (
    <Button
      type="submit"
      size="icon"
      disabled={status === 'disabled' || (status === 'ready' && isDisabled)}
      className={cn('h-9 w-9 shrink-0', className)}
      {...props}
    >
      {status === 'streaming' ? (
        <Square className="size-4 fill-current" />
      ) : (
        <ArrowUp className="size-4" />
      )}
    </Button>
  );
}

interface PromptInputToolbarProps extends ComponentProps<'div'> {}

export function PromptInputToolbar({ className, children, ...props }: PromptInputToolbarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}

interface PromptInputToolsProps extends ComponentProps<'div'> {}

export function PromptInputTools({ className, children, ...props }: PromptInputToolsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)} {...props}>
      {children}
    </div>
  );
}

