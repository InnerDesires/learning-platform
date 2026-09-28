import React from 'react'

import { getNavTree } from '@/lib/admin-docs/loader'
import { TRACKS, type DocsTrack } from '@/lib/admin-docs/types'

import { DocsSidebar } from '../DocsSidebar.client'

/**
 * Two-column shell shared by the track home and article views: the left
 * sidebar (track switcher, search, category nav) and the content area.
 */
export const DocsShell: React.FC<{
  activeUrl: string
  children: React.ReactNode
  track: DocsTrack
}> = ({ activeUrl, children, track }) => (
  <div className="admin-docs__shell">
    <DocsSidebar
      activeUrl={activeUrl}
      nav={getNavTree(track)}
      track={track}
      trackLabels={{
        manager: TRACKS.manager.shortLabel,
        technical: TRACKS.technical.shortLabel,
      }}
    />
    <div className="admin-docs__main">{children}</div>
  </div>
)
