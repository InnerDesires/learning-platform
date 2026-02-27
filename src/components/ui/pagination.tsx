import type { ButtonProps } from '@/components/ui/button'

import { buttonVariants } from '@/components/ui/button'
import type { SiteLocale } from '@/utilities/locales'
import { cn } from '@/utilities/ui'
import { getFrontendMessages } from '@/utilities/i18n'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import * as React from 'react'

const Pagination = ({
  className,
  locale = 'uk',
  ...props
}: React.ComponentProps<'nav'> & { locale?: SiteLocale }) => (
  <nav
    aria-label={getFrontendMessages(locale).paginationAriaLabel}
    className={cn('mx-auto flex w-full justify-center', className)}
    role="navigation"
    {...props}
  />
)

const PaginationContent: React.FC<
  { ref?: React.Ref<HTMLUListElement> } & React.HTMLAttributes<HTMLUListElement>
> = ({ className, ref, ...props }) => (
  <ul className={cn('flex flex-row items-center gap-1', className)} ref={ref} {...props} />
)

const PaginationItem: React.FC<
  { ref?: React.Ref<HTMLLIElement> } & React.HTMLAttributes<HTMLLIElement>
> = ({ className, ref, ...props }) => <li className={cn('', className)} ref={ref} {...props} />

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'button'>

const PaginationLink = ({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) => (
  <button
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        size,
        variant: isActive ? 'outline' : 'ghost',
      }),
      className,
    )}
    {...props}
  />
)

const PaginationPrevious = ({
  className,
  locale = 'uk',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { locale?: SiteLocale }) => (
  <PaginationLink
    aria-label={getFrontendMessages(locale).paginationPrevAria}
    className={cn('gap-1 pl-2.5', className)}
    size="default"
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>{getFrontendMessages(locale).paginationPrev}</span>
  </PaginationLink>
)

const PaginationNext = ({
  className,
  locale = 'uk',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { locale?: SiteLocale }) => (
  <PaginationLink
    aria-label={getFrontendMessages(locale).paginationNextAria}
    className={cn('gap-1 pr-2.5', className)}
    size="default"
    {...props}
  >
    <span>{getFrontendMessages(locale).paginationNext}</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)

const PaginationEllipsis = ({
  className,
  locale = 'uk',
  ...props
}: React.ComponentProps<'span'> & { locale?: SiteLocale }) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">{getFrontendMessages(locale).paginationMore}</span>
  </span>
)

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
