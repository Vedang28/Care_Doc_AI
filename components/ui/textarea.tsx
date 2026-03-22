import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm text-slate-deep placeholder:text-slate-mid/60',
          'transition-colors focus-visible:outline-none focus-visible:border-care focus-visible:bg-white focus-visible:ring-0',
          'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
