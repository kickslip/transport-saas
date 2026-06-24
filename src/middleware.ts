import { auth } from '@/lib/auth-edge'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const path = req.nextUrl.pathname
  if (!req.auth) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(signInUrl)
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*', '/passenger/:path*', '/api/protected/:path*'],
}
