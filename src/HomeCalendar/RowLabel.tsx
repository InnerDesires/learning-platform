'use client'
import { HomeCalendar } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<HomeCalendar['events']>[number]>()

  const label = data?.data?.title
    ? `${data.rowNumber !== undefined ? `${data.rowNumber + 1}. ` : ''}${data.data.title}${data.data.range ? ` — ${data.data.range}` : ''}`
    : 'Зміна'

  return <div>{label}</div>
}
