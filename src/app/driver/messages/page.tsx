import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function DriverMessagesPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  // Get all trips that have messages, grouped by trip
  const trips = await prisma.trip.findMany({
    where: {
      driverId: session.user.id,
      messages: { some: {} },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { firstName: true, role: true } } },
      },
      bookings: {
        take: 1,
        include: {
          passenger: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>

      {trips.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">No messages yet</p>
          <p className="text-sm mt-1">Messages from passengers will appear here during trips</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden divide-y">
          {trips.map((trip) => {
            const lastMsg = trip.messages[0]
            const passenger = trip.bookings[0]?.passenger
            return (
              <Link
                key={trip.id}
                href={`/passenger/trips/${trip.bookings[0]?.id}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-none">
                  {passenger?.firstName?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Passenger'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {trip.startLocationName} → {trip.endLocationName}
                  </p>
                  {lastMsg && (
                    <p className="text-sm text-gray-400 truncate mt-0.5">
                      {lastMsg.sender.role === 'DRIVER' ? 'You: ' : ''}{lastMsg.content}
                    </p>
                  )}
                </div>
                {lastMsg && (
                  <span className="text-xs text-gray-400 flex-none">
                    {new Date(lastMsg.createdAt).toLocaleDateString()}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
