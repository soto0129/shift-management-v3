// app/layout.js
import './globals.css'
import { Providers } from './providers'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
  title: 'シフト管理システム',
  description: 'シフトを自動生成するWebアプリ',
}

export default function RootLayout({ children }) {
  return (
    <html lang='ja'>
      <body>
        <AuthProvider>
          <Providers>
            {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}
