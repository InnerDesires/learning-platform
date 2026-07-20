/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      typography: () => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--fog)',
              '--tw-prose-headings': 'var(--cloud)',
              '--tw-prose-lead': 'var(--fog)',
              '--tw-prose-links': 'var(--amber)',
              '--tw-prose-bold': 'var(--cloud)',
              '--tw-prose-counters': 'var(--steel)',
              '--tw-prose-bullets': 'var(--orange)',
              '--tw-prose-hr': 'var(--line)',
              '--tw-prose-quotes': 'var(--cloud)',
              '--tw-prose-quote-borders': 'var(--orange)',
              '--tw-prose-captions': 'var(--steel)',
              '--tw-prose-code': 'var(--amber)',
              '--tw-prose-pre-code': 'var(--cloud)',
              '--tw-prose-pre-bg': 'var(--ink)',
              '--tw-prose-th-borders': 'var(--line-2)',
              '--tw-prose-td-borders': 'var(--line)',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: '2.5rem',
              },
              h2: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: '3.5rem',
              },
              h2: {
                fontSize: '1.5rem',
              },
            },
          ],
        },
      }),
    },
  },
}

export default config
