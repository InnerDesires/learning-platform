'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = Omit<React.ComponentProps<'input'>, 'type'> & {
  /** aria-labels for the toggle button */
  showLabel: string
  hideLabel: string
}

/** Password field with a show/hide toggle. Keeps the same id/name/autofill contract as a plain input. */
export const PasswordInput: React.FC<Props> = ({ showLabel, hideLabel, className, ...props }) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={
          className ??
          'w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-ring'
        }
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-steel transition-colors hover:text-cloud"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
