import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })

    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(signInUrl)
    }

    const role = (token.role as string) ?? ''

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
  } catch (e) {
    console.error('[middleware] auth check failed', e)
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*', '/passenger/:path*', '/api/protected/:path*'],
}
