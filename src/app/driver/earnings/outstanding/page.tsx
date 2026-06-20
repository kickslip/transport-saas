import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import CashCollectButton from '@/app/driver/trips/CashCollectButton'

export default async function OutstandingPaymentsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  // Completed trips with no payment record
  const trips = await prisma.trip.findMany({
    where: {
      driverId: session.user.id,
      status: 'COMPLETED',
      payments: { none: {} },
    },
    include: {
      bookings: {
        select: { id: true, totalPrice: true, status: true, passenger: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { actualEndTime: 'desc' },
    take: 30,
  }).catch(() => [])

  const totalOwed = trips.reduce(
    (sum, t) => sum + t.bookings.reduce((s, b) => s + b.totalPrice, 0),
    0
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/driver/earnings" className="text-gray-500 hover:text-gray-700">← Earnings</Link>
        <h1 className="text-xl font-bold text-gray-900">Outstanding Payments</h1>
      </div>

      {trips.length > 0 && (
        <div className="card bg-orange-50 border border-orange-200">
          <p className="text-sm text-orange-800">
            <strong>R{(totalOwed / 100).toFixed(2)}</strong> outstanding across {trips.length} trip(s)
          </p>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">✅</p>
          <p>All payments collected — nothing outstanding!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip.id} className="card space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{trip.startLocationName} → {trip.endLocationName}</p>
                  <p className="text-xs text-gray-400">
                    {trip.actualEndTime ? new Date(trip.actualEndTime).toLocaleString() : 'Completed'}
                  </p>
                </div>
                <p className="font-bold text-gray-900">
                  R{(trip.bookings.reduce((s, b) => s + b.totalPrice, 0) / 100).toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                {trip.bookings.map((b) => (
                  <div key={b.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{b.passenger.firstName} {b.passenger.lastName}</span>
                    <CashCollectButton bookingId={b.id} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
