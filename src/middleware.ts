import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Role-based access control
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (path.startsWith('/driver') && !['DRIVER', 'ADMIN'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (path.startsWith('/passenger') && !['PASSENGER', 'ADMIN'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*', '/passenger/:path*', '/api/protected/:path*'],
}
