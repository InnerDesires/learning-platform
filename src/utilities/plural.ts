import type { SiteLocale } from '@/utilities/locales'

/**
 * Pick the correct plural form for a count.
 * `forms` is pipe-separated: uk expects «one|few|many» («крок|кроки|кроків»),
 * en expects "one|other" ("step|steps").
 */
export const plural = (locale: SiteLocale, count: number, forms: string): string => {
  const parts = forms.split('|')
  if (locale === 'uk') {
    const n10 = count % 10
    const n100 = count % 100
    if (n10 === 1 && n100 !== 11) return parts[0] ?? ''
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return parts[1] ?? parts[0] ?? ''
    return parts[2] ?? parts[1] ?? parts[0] ?? ''
  }
  return count === 1 ? (parts[0] ?? '') : (parts[1] ?? parts[0] ?? '')
}
