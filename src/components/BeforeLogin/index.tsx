import React from 'react'

const BeforeLogin: React.FC = () => {
  return (
    <div style={{ marginBottom: 'calc(var(--base) * 1.5)', textAlign: 'center' }}>
      <p>
        <b>Вітаємо в панелі адміністратора!</b>
        {' Увійдіть, щоб керувати курсами, публікаціями та користувачами платформи.'}
      </p>
    </div>
  )
}

export default BeforeLogin
