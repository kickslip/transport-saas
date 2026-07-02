import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TripTracker from '@/components/passenger/TripTracker'
import TripChat from '@/components/shared/TripChat'
import { getMessages } from '@/app/actions/messages'
import ReviewForm from '@/components/passenger/ReviewForm'

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, passengerId: session.user.id },
    include: {
      trip: {
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
        },
      },
    },
  })

  if (!booking) notFound()

  const [messages, existingReview] = await Promise.all([
    getMessages(booking.tripId),
    prisma.review.findUnique({
      where: { bookingId: params.id },
      select: { rating: true, comment: true, createdAt: true },
    }),
  ])
  const isActive = ['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(booking.status)
  const isCompleted = booking.status === 'COMPLETED'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/passenger/trips" className="text-gray-500 hover:text-gray-700">← My Trips</Link>
        <h1 className="text-xl font-bold text-gray-900">Trip Details</h1>
      </div>

      {/* Booking summary */}
      <div className="card space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
              booking.status.includes('CANCEL') ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {booking.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="font-bold text-gray-900">R{(booking.totalPrice / 100).toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">From</p>
            <p className="font-medium text-gray-900">{booking.trip.startLocationName}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">To</p>
            <p className="font-medium text-gray-900">{booking.trip.endLocationName}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Scheduled</p>
            <p className="font-medium text-gray-900">
              {new Date(booking.trip.scheduledStartTime).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Driver</p>
            {booking.trip.driver ? (
              <>
                <p className="font-medium text-gray-900">
                  {booking.trip.driver.firstName} {booking.trip.driver.lastName}
                </p>
                {booking.trip.driver.phoneNumber && (
                  <a href={`tel:${booking.trip.driver.phoneNumber}`} className="text-primary-600 text-xs hover:underline">
                    {booking.trip.driver.phoneNumber}
                  </a>
                )}
              </>
            ) : (
              <p className="font-medium text-gray-900">Awaiting driver assignment</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Tracking (only for active trips) */}
      {isActive && booking.trip.driver && (
        <TripTracker
          tripId={booking.tripId}
          driverName={`${booking.trip.driver.firstName} ${booking.trip.driver.lastName}`}
          driverPhone={booking.trip.driver.phoneNumber}
          pickup={{
            lat: booking.trip.startLocationLat,
            lng: booking.trip.startLocationLng,
            name: booking.trip.startLocationName,
          }}
          dropoff={{
            lat: booking.trip.endLocationLat,
            lng: booking.trip.endLocationLng,
            name: booking.trip.endLocationName,
          }}
        />
      )}

      {/* Review section */}
      {isCompleted && (
        <div className="flex justify-end">
          <Link href={`/passenger/trips/${params.id}/receipt`} className="text-sm text-primary-600 hover:underline">
            🧾 View Receipt →
          </Link>
        </div>
      )}

      {isCompleted && booking.trip.driver && (
        existingReview ? (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Your Review</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 text-xl">{'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</span>
              <span className="text-sm text-gray-500">{new Date(existingReview.createdAt).toLocaleDateString()}</span>
            </div>
            {existingReview.comment && <p className="text-sm text-gray-700">{existingReview.comment}</p>}
          </div>
        ) : (
          <ReviewForm
            bookingId={booking.id}
            driverId={booking.trip.driver.id}
            driverName={`${booking.trip.driver.firstName} ${booking.trip.driver.lastName}`}
          />
        )
      )}

      {/* Chat */}
      {booking.trip.driver && (
        <TripChat
          tripId={booking.tripId}
          currentUserId={session.user.id}
          receiverId={booking.trip.driver.id}
          initialMessages={messages as any}
        />
      )}
    </div>
  )
}
