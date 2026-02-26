import slugifyLib from 'slugify'
import type { PayloadRequest } from 'payload'

export const cyrillicSlugify = ({
  valueToSlugify,
}: {
  data: any
  req: PayloadRequest
  valueToSlugify?: string
}) => slugifyLib(valueToSlugify || '', { lower: true, strict: true, locale: 'uk' })
