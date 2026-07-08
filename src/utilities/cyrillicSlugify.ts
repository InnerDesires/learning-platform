import slugifyLib from 'slugify'
import type { PayloadRequest } from 'payload'

export const cyrillicSlugify = ({
  valueToSlugify,
}: {
  data: any
  req: PayloadRequest
  valueToSlugify?: string
}): string | undefined => {
  const slug = slugifyLib(valueToSlugify ?? '', { lower: true, strict: true, locale: 'uk' })

  // Return `undefined` (stored as NULL) instead of an empty string when there's
  // nothing to slugify. Payload's slug generator sets `slug = ''` on autosaved
  // draft creation before a title is entered, and Postgres treats multiple ''
  // values as a unique-constraint violation (`valueMustBeUnique`) while allowing
  // multiple NULLs. This keeps new-document autosave from colliding on `slug`.
  return slug || undefined
}
