import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass} data-testid="before-dashboard-root">
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Залізна Зміна — панель адміністратора</h4>
      </Banner>
      <ul className={`${baseClass}__instructions`}>
        <li>
          <SeedButton />
          {' to populate the site with demo content, then '}
          <a href="/" target="_blank">
            visit the website
          </a>
          {' to see the results.'}
        </li>
        <li>
          Use the sidebar to manage pages, posts, media, and users.
        </li>
      </ul>
    </div>
  )
}

export default BeforeDashboard
