import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-semibold uppercase tracking-[0.1em] text-sm transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_rgb(249_140_31/0.6)] hover:bg-amber hover:-translate-y-px hover:shadow-[0_10px_26px_-8px_rgb(249_140_31/0.7)] active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border-[1.5px] border-line-2 bg-transparent text-cloud hover:border-orange hover:text-orange',
        secondary:
          'bg-brand-blue text-white shadow-[inset_0_0_0_1px_var(--blue-line),0_6px_20px_-10px_rgb(4_40_113/0.9)] hover:bg-[#0A3A9E] hover:-translate-y-px',
        ghost:
          'hover:bg-primary/10 hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline normal-case tracking-normal font-sans',
      },
      size: {
        clear: '',
        default: 'h-11 px-7 py-2 has-[>svg]:px-4',
        sm: 'h-9 px-4 has-[>svg]:px-2.5 text-xs',
        lg: 'h-12 px-8 has-[>svg]:px-5 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button: React.FC<ButtonProps> = ({ asChild = false, className, size, variant, ...props }) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
