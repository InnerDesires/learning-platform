// Only same-site relative paths are allowed — absolute URLs, protocol-relative //host and
// backslash tricks all fall back.
export const safeRedirectPath = (
  value: string | null | undefined,
  fallback: string,
): string => {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || /[\\]|:\/\//.test(value)) {
    return fallback
  }
  return value
}
