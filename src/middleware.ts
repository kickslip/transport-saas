import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

  if (!session) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(signInUrl)
  }

  const role = (session.user as any)?.role

  // Role-based access control
  if (path.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  if (path.startsWith('/driver') && !['DRIVER', 'ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  if (path.startsWith('/passenger') && !['PASSENGER', 'ADMIN'].includes(role)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*', '/passenger/:path*', '/api/protected/:path*'],
}
