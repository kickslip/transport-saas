import { getUpcomingTrips, getPastTrips } from '@/app/actions/booking'
import CancelBookingButton from './CancelBookingButton'
import Link from 'next/link'

function formatPrice(cents: number) {
  return `R${(cents / 100).toFixed(2)}`
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    DRIVER_ASSIGNED: 'bg-indigo-100 text-indigo-800',
    DRIVER_EN_ROUTE: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED_BY_PASSENGER: 'bg-red-100 text-red-700',
    CANCELLED_BY_DRIVER: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-orange-100 text-orange-700',
  }
  const label = status.replace(/_/g, ' ')
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

export default async function MyTripsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingTrips(), getPastTrips()])

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
        <Link href="/passenger/book/on-demand" className="btn-primary text-sm px-4 py-2">
          + Book a Ride
        </Link>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">
            <p className="text-3xl mb-2">📅</p>
            <p>No upcoming trips</p>
            <Link href="/passenger/book/on-demand" className="text-primary-600 hover:underline text-sm mt-1 inline-block">
              Book your first trip →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <div key={booking.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(booking.status)}
                      <span className="text-xs text-gray-400">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {booking.trip.startLocationName} → {booking.trip.endLocationName}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {booking.trip.driver
                        ? `Driver: ${booking.trip.driver.firstName} ${booking.trip.driver.lastName}`
                        : 'Awaiting driver assignment'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(booking.totalPrice)}</p>
                    <Link href={`/passenger/trips/${booking.id}`} className="text-xs text-primary-600 hover:underline block mt-1">
                      View →
                    </Link>
                    <CancelBookingButton bookingId={booking.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Past Trips ({past.length})</h2>
        {past.length === 0 ? (
          <div className="card text-center py-6 text-gray-400 text-sm">No past trips yet</div>
        ) : (
          <div className="space-y-3">
            {past.map((booking) => (
              <div key={booking.id} className="card opacity-80">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(booking.status)}
                      <span className="text-xs text-gray-400">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {booking.trip.startLocationName} → {booking.trip.endLocationName}
                    </p>
                  </div>
                  <p className="font-bold text-gray-700">{formatPrice(booking.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
