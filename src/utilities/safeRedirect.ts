/**
 * Only allow same-site relative paths for post-auth redirects — anything else
 * (absolute URLs, protocol-relative //host, backslash tricks) falls back.
 */
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
