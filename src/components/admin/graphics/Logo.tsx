import React from 'react'

// Inline styles only — admin pages don't load the frontend Tailwind bundle, and
// `--theme-text` keeps the wordmark legible in both admin themes.
const Logo: React.FC = () => {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <img alt="Залізна Зміна" src="/logo-iron-squad.svg" style={{ height: 72, width: 'auto' }} />
      <span
        style={{
          color: 'var(--theme-text)',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.08em',
          lineHeight: 1.2,
          textTransform: 'uppercase',
        }}
      >
        Залізна <em style={{ color: '#F98C1F', fontStyle: 'normal' }}>Зміна</em>
      </span>
      <span
        style={{
          color: 'var(--theme-elevation-500)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
        }}
      >
        Панель адміністратора
      </span>
    </div>
  )
}

export default Logo
