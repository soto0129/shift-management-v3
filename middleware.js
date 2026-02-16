// middleware.js
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // セッションを取得
  const { data: { session } } = await supabase.auth.getSession()

  // 認証不要なページ
  const isAuthPage = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup'

  // 未ログインで認証が必要なページにアクセスした場合
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // ログイン済みでログインページにアクセスした場合
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
