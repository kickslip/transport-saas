import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const cookie = req.headers.get('cookie') ?? ''

  // Lightweight session cookie check (JWT verification happens in pages/actions)
  const sessionToken = cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('next-auth.session-token=') || c.startsWith('__Secure-next-auth.session-token='))

  if (!sessionToken) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*', '/passenger/:path*', '/api/protected/:path*'],
}
