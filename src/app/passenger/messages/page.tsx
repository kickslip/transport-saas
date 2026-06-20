import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function PassengerMessagesPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  // Get all bookings that have messages on their trip
  const bookings = await prisma.booking.findMany({
    where: {
      passengerId: session.user.id,
      trip: { messages: { some: {} } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      trip: {
        include: {
          driver: { select: { firstName: true, lastName: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { firstName: true, role: true } } },
          },
        },
      },
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>

      {bookings.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">No messages yet</p>
          <p className="text-sm mt-1">Chat with your driver during trips from the trip detail page</p>
          <Link href="/passenger/trips" className="inline-block mt-3 text-primary-600 hover:underline text-sm">
            My Trips →
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden divide-y">
          {bookings.map((booking) => {
            const lastMsg = booking.trip.messages[0]
            const driver = booking.trip.driver
            return (
              <Link
                key={booking.id}
                href={`/passenger/trips/${booking.id}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold flex-none">
                  {driver.firstName?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {driver.firstName} {driver.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {booking.trip.startLocationName} → {booking.trip.endLocationName}
                  </p>
                  {lastMsg && (
                    <p className="text-sm text-gray-400 truncate mt-0.5">
                      {lastMsg.sender.role === 'PASSENGER' ? 'You: ' : `${lastMsg.sender.firstName}: `}
                      {lastMsg.content}
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
