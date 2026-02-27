'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'

export const Error = ({ name, fallbackMessage }: { fallbackMessage?: string; name: string }) => {
  const {
    formState: { errors },
  } = useFormContext()
  return (
    <div className="mt-2 text-red-500 text-sm">
      {(errors[name]?.message as string) || fallbackMessage || 'This field is required'}
    </div>
  )
}
