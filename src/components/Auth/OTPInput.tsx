'use client'

import React, { useRef, useCallback } from 'react'

const OTP_LENGTH = 6

export const OTPInput: React.FC<{
  value: string
  onChange: (otp: string) => void
  disabled?: boolean
}> = ({ value, onChange, disabled }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '')

  const setDigit = useCallback(
    (index: number, char: string) => {
      const next = [...digits]
      next[index] = char
      onChange(next.join(''))
    },
    [digits, onChange],
  )

  const handleInput = (index: number, e: React.FormEvent<HTMLInputElement>) => {
    const val = (e.target as HTMLInputElement).value
    const char = val.replace(/\D/g, '').slice(-1)
    setDigit(index, char)
    if (char && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigit(index, '')
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus()
        setDigit(index - 1, '')
      }
      e.preventDefault()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = pasted.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH)
    onChange(next.join(''))
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          value={digit}
          disabled={disabled}
          onInput={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="h-12 w-10 rounded-lg border border-input bg-background text-center text-lg font-semibold outline-none transition focus:ring-2 focus:ring-ring disabled:opacity-50 sm:h-14 sm:w-12 sm:text-xl"
        />
      ))}
    </div>
  )
}
