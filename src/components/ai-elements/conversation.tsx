'use client';

import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useStickToBottom } from 'use-stick-to-bottom';
import { Button } from '@/components/ui/button';

// Context for stick-to-bottom functionality
type StickToBottomContext = ReturnType<typeof useStickToBottom>;

const ConversationContext = createContext<StickToBottomContext | null>(null);

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a Conversation');
  }
  return context;
}

interface ConversationProps extends Omit<ComponentProps<'div'>, 'children'> {
  children: ReactNode | ((context: StickToBottomContext) => ReactNode);
}

export function Conversation({ children, className, ...props }: ConversationProps) {
  const stickToBottom = useStickToBottom();

  return (
    <ConversationContext.Provider value={stickToBottom}>
      <div
        ref={stickToBottom.scrollRef}
        className={cn(
          'relative flex-1 min-h-0',
          // overflow-auto only shows scrollbar when content exceeds container
          'overflow-auto',
          className
        )}
        {...props}
      >
        {typeof children === 'function' ? children(stickToBottom) : children}
      </div>
    </ConversationContext.Provider>
  );
}

interface ConversationContentProps extends Omit<ComponentProps<'div'>, 'children'> {
  children: ReactNode | ((context: StickToBottomContext) => ReactNode);
}

export function ConversationContent({ children, className, ...props }: ConversationContentProps) {
  const context = useConversation();

  return (
    <div
      ref={context.contentRef}
      className={cn('flex flex-col gap-3 p-4', className)}
      {...props}
    >
      {typeof children === 'function' ? children(context) : children}
    </div>
  );
}

interface ConversationEmptyStateProps extends ComponentProps<'div'> {
  icon?: ReactNode;
  title?: string;
  description?: string;
}

export function ConversationEmptyState({
  icon,
  title = 'No messages yet',
  description = 'Start a conversation to see messages here',
  children,
  className,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center',
        className
      )}
      {...props}
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function ConversationScrollButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  const context = useConversation();

  if (context.isAtBottom) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg',
        className
      )}
      onClick={() => context.scrollToBottom()}
      {...props}
    >
      <ChevronDown className="size-4" />
    </Button>
  );
}

export function ConversationScrollControls({
  className,
  ...props
}: ComponentProps<'div'>) {
  const context = useConversation();
  const isAtTop = context.state.scrollTop <= 2;
  const isAtBottom = context.isAtBottom;

  const handleScrollToTop = () => {
    const scrollElement = context.scrollRef.current;
    if (!scrollElement) {
      return;
    }
    scrollElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAtTop && isAtBottom) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute bottom-4 right-4 flex flex-col items-center gap-2',
        className
      )}
      {...props}
    >
      {!isAtTop && (
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg"
          onClick={handleScrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp className="size-4" />
        </Button>
      )}
      {!isAtBottom && (
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg"
          onClick={() => context.scrollToBottom('smooth')}
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="size-4" />
        </Button>
      )}
    </div>
  );
}
