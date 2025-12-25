import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  onPaste,
  ...props
}: React.ComponentProps<"textarea">) {
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    onPaste?.(event)
    if (event.defaultPrevented) {
      return
    }
    requestAnimationFrame(() => {
      event.currentTarget.scrollTop = 0
    })
  }

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 max-h-[320px] w-full min-w-0 max-w-full overflow-x-hidden rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      onPaste={handlePaste}
      {...props}
    />
  )
}

export { Textarea }
