import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import TripControls from './TripControls'
import CashCollectButton from './CashCollectButton'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING_DRIVER: 'bg-yellow-100 text-yellow-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    DRIVER_ASSIGNED: 'bg-indigo-100 text-indigo-800',
    DRIVER_EN_ROUTE: 'bg-purple-100 text-purple-800',
    DRIVER_ARRIVED: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default async function DriverTripsPage() {
  const session = await auth()

  const trips = session?.user?.id
    ? await prisma.trip.findMany({
        where: { driverId: session.user.id },
        include: {
          bookings: { select: { id: true, seatsBooked: true, status: true }, take: 1 },
          payments: { select: { id: true, method: true, status: true }, take: 1 },
          vehicle: { select: { make: true, model: true, registrationNumber: true } },
        },
        orderBy: { scheduledStartTime: 'desc' },
        take: 30,
      }).catch(() => [])
    : []

  const active = trips.filter((t) => ['SCHEDULED', 'IN_PROGRESS'].includes(t.status as string))
  const past = trips.filter((t) => !['SCHEDULED', 'IN_PROGRESS'].includes(t.status as string))

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>

      {/* Active */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Active / Upcoming ({active.length})</h2>
        {active.length === 0 ? (
          <div className="card text-center py-8 text-gray-400 text-sm">No active trips</div>
        ) : (
          <div className="space-y-3">
            {active.map((trip) => (
              <div key={trip.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      {statusBadge(trip.status as string)}
                      <span className="text-xs text-gray-400">
                        {new Date(trip.scheduledStartTime).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {trip.startLocationName} → {trip.endLocationName}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {(trip as any).bookings.length} booking(s) ·{' '}
                      {(trip as any).vehicle ? `${(trip as any).vehicle.make} ${(trip as any).vehicle.model}` : 'No vehicle'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">R{(trip.totalPrice / 100).toFixed(2)}</p>
                    <div className="mt-1">
                      <TripControls tripId={trip.id} status={trip.status as string} />
                    </div>
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
            {past.map((trip) => (
              <div key={trip.id} className="card opacity-80">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      {statusBadge(trip.status as string)}
                      <span className="text-xs text-gray-400">
                        {new Date(trip.scheduledStartTime).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {trip.startLocationName} → {trip.endLocationName}
                    </p>
                    <p className="text-sm text-gray-500">{(trip as any).bookings.length} passenger(s)</p>
                    {(trip as any).payments.length === 0 && (trip as any).bookings[0]?.id && (
                      <div className="mt-1">
                        <CashCollectButton bookingId={(trip as any).bookings[0].id} />
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-gray-700">R{(trip.totalPrice / 100).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
