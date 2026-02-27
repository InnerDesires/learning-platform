'use client'
import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { SiteLocale } from '@/utilities/locales'
import { cn } from '@/utilities/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

export const Pagination: React.FC<{
  className?: string
  locale: SiteLocale
  page: number
  totalPages: number
}> = (props) => {
  const router = useRouter()

  const { className, locale, page, totalPages } = props
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1
  const getPath = (targetPage: number) =>
    locale === 'en' ? `/en/posts/page/${targetPage}` : `/posts/page/${targetPage}`

  const hasExtraPrevPages = page - 1 > 1
  const hasExtraNextPages = page + 1 < totalPages

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent locale={locale}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              locale={locale}
              disabled={!hasPrevPage}
              onClick={() => {
                router.push(getPath(page - 1))
              }}
            />
          </PaginationItem>

          {hasExtraPrevPages && (
            <PaginationItem>
              <PaginationEllipsis locale={locale} />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  router.push(getPath(page - 1))
                }}
              >
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink
              isActive
              onClick={() => {
                router.push(getPath(page))
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  router.push(getPath(page + 1))
                }}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {hasExtraNextPages && (
            <PaginationItem>
              <PaginationEllipsis locale={locale} />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              locale={locale}
              disabled={!hasNextPage}
              onClick={() => {
                router.push(getPath(page + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
    </div>
  )
}
