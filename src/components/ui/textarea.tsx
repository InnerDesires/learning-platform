import { cn } from '@/utilities/ui'
import * as React from 'react'

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className,
  ...props
}) => {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground outline-ring/50 aria-invalid:outline-destructive/60 aria-invalid:ring-destructive/20 aria-invalid:border-destructive/60 flex field-sizing-content min-h-16 w-full rounded-xl border bg-card px-4 py-3 text-base shadow-xs transition-all focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-1 focus-visible:outline-primary/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
