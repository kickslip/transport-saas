import Link from 'next/link'
import { getPassengerStats, getUpcomingTrips } from '@/app/actions/booking'

export default async function PassengerDashboardPage() {
  const [stats, upcoming] = await Promise.all([getPassengerStats(), getUpcomingTrips()])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 sm:text-3xl">Passenger Dashboard</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <p className="text-sm text-gray-500">Upcoming Trips</p>
          <p className="text-xl font-bold text-primary-600 sm:text-2xl">{stats.upcoming}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Wallet Balance</p>
          <p className="text-xl font-bold text-green-600 sm:text-2xl">R0.00</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Trips</p>
          <p className="text-xl font-bold text-gray-700 sm:text-2xl">{stats.total}</p>
        </div>
      </div>

      {/* Book a Trip Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Book a Trip</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-medium text-gray-800 mb-2">🚗 On-Demand Ride</p>
            <p className="text-sm text-gray-600 mb-4">Request a ride right now.</p>
            <Link href="/passenger/book/on-demand" className="btn-primary inline-block text-sm">
              Request Now
            </Link>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-medium text-gray-800 mb-2">📅 Scheduled Route</p>
            <p className="text-sm text-gray-600 mb-4">Browse existing recurring routes.</p>
            <Link href="/passenger/book/scheduled" className="btn-primary inline-block text-sm">
              Browse Routes
            </Link>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-medium text-gray-800 mb-2">🛤️ Custom Route</p>
            <p className="text-sm text-gray-600 mb-4">Set up your own commute route.</p>
            <Link href="/passenger/book/custom-schedule" className="btn-primary inline-block text-sm">
              Request Route
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Trips */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
          <Link href="/passenger/trips" className="text-primary-600 hover:text-primary-500 text-sm">
            View All →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-3">📅</p>
            <p>No upcoming trips</p>
            <Link href="/passenger/book/on-demand" className="text-primary-600 hover:text-primary-500 mt-2 inline-block text-sm">
              Book your first trip →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((b) => (
              <div key={b.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {b.trip.startLocationName} → {b.trip.endLocationName}
                  </p>
                  <p className="text-xs text-gray-400">{b.status.replace(/_/g, ' ')}</p>
                </div>
                <p className="font-semibold text-gray-700 text-sm">R{(b.totalPrice / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
