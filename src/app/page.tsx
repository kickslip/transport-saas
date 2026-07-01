import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with background image */}
      <div
        className="relative min-h-screen flex flex-col"
        style={{
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-blue-950/75" />

        {/* Header */}
        <header className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-white drop-shadow">WanToe</span>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 rounded-lg border border-white text-white font-medium hover:bg-white hover:text-blue-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <main className="relative z-10 flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight" style={{textShadow:'0 2px 16px rgba(0,0,0,0.8)'}}>
                Your Ride, Your Route
                <span className="block text-yellow-400">WanToe</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-white font-medium" style={{textShadow:'0 1px 8px rgba(0,0,0,0.7)'}}>
                Book on-demand rides or scheduled commuter trips with trusted local drivers.
                Simple, safe, and built for your neighbourhood.
              </p>
              <div className="mt-10 flex justify-center gap-4 flex-wrap">
                <Link
                  href="/auth/register?role=passenger"
                  className="px-8 py-3 text-lg rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 transition-colors shadow-lg"
                >
                  I'm a Passenger
                </Link>
                <Link
                  href="/auth/register?role=driver"
                  className="px-8 py-3 text-lg rounded-lg border-2 border-white text-white font-semibold hover:bg-white hover:text-blue-900 transition-colors shadow-lg"
                >
                  I'm a Driver
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">On-Demand Rides</h3>
            <p className="text-gray-600">Request rides instantly. Track your driver in real-time and pay securely.</p>
          </div>

          <div className="card">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Scheduled Commutes</h3>
            <p className="text-gray-600">Book recurring trips for work. Set it once, ride every day with flexible payment plans.</p>
          </div>

          <div className="card">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fleet Management</h3>
            <p className="text-gray-600">Transport companies manage vehicles, drivers, and schedules with powerful dashboards.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} WanToe. All rights reserved.</p>
            <p className="mt-2">POPIA Compliant • Secure • Scalable</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
