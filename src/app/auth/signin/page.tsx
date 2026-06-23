'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? undefined
  const registered = searchParams.get('registered') === 'true'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        if (callbackUrl) {
          router.push(callbackUrl)
        } else {
          const session = await getSession()
          const role = (session?.user as any)?.role
          if (role === 'DRIVER') router.push('/driver')
          else if (role === 'ADMIN') router.push('/admin')
          else router.push('/passenger')
        }
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: callbackUrl ?? '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        {registered && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">Account created! Please sign in.</p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input rounded-t-md"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input rounded-b-md"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="ml-2">Google</span>
            </button>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            🧪 Demo Accounts — One-Click Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Admin',     email: 'admin@example.com',     password: 'admin123',     color: 'bg-purple-100 text-purple-800 hover:bg-purple-200', icon: '🛡️' },
              { label: 'Driver',    email: 'driver@example.com',    password: 'driver123',    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',     icon: '🚐' },
              { label: 'Passenger', email: 'passenger@example.com', password: 'passenger123', color: 'bg-green-100 text-green-800 hover:bg-green-200',   icon: '🧍' },
            ].map(({ label, email: e, password: p, color, icon }) => (
              <button
                key={label}
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true)
                  setError('')
                  const result = await signIn('credentials', { email: e, password: p, redirect: false })
                  if (result?.error) {
                    setError('Demo login failed')
                    setIsLoading(false)
                  } else {
                    const session = await getSession()
                    const role = (session?.user as any)?.role
                    if (role === 'DRIVER') router.push('/driver')
                    else if (role === 'ADMIN') router.push('/admin')
                    else router.push('/passenger')
                    router.refresh()
                  }
                }}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-xs font-medium transition-colors ${color}`}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <SignInForm />
    </Suspense>
  )
}
