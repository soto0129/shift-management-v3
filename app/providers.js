// app/providers.js
'use client'

import { Toaster } from 'react-hot-toast'

// Toast通知用のプロバイダー
export function Providers({ children }) {
  return (
    <>
      {children}
      <Toaster
        position='top-right'
        toastOptions={{
          duration: 3000,
          style: { background: '#333', color: '#fff' },
        }}
      />
    </>
  )
}
