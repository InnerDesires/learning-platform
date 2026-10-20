import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  )
}

// PR previews are opened on the stable branch alias, which may contain routes
// that do not exist on the production domain yet.
export const getPreviewAwareServerURL = (): string => {
  const previewHost = process.env.VERCEL_ENV === 'preview'
    ? process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
    : undefined
  return previewHost ? `https://${previewHost}` : getServerSideURL()
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}
