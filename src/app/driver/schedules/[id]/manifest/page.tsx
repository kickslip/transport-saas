import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AttendanceToggle from './AttendanceToggle'

export default async function ManifestPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const schedule = await prisma.tripSchedule.findFirst({
    where: { id: params.id, driverId: session.user.id },
    include: {
      trips: {
        where: { status: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] } },
        orderBy: { scheduledStartTime: 'desc' },
        take: 1,
        include: {
          bookings: {
            include: {
              passenger: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
            },
          },
        },
      },
    },
  })

  if (!schedule) notFound()

  const latestTrip = schedule.trips[0]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/driver/schedules" className="text-gray-500 hover:text-gray-700">← Schedules</Link>
        <h1 className="text-xl font-bold text-gray-900">Passenger Manifest</h1>
      </div>

      <div className="card space-y-1">
        <h2 className="font-semibold text-gray-900">{schedule.name}</h2>
        <p className="text-sm text-gray-500">
          {schedule.startLocationName} → {schedule.endLocationName}
        </p>
        {latestTrip && (
          <p className="text-xs text-gray-400">
            {new Date(latestTrip.scheduledStartTime).toLocaleString()}
          </p>
        )}
      </div>

      {!latestTrip ? (
        <div className="card text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p>No trip generated yet for this schedule</p>
        </div>
      ) : latestTrip.bookings.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">🪑</p>
          <p>No passengers booked yet</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex justify-between text-xs font-medium text-gray-500 uppercase">
            <span>Passenger</span>
            <span>Attended</span>
          </div>
          <div className="divide-y">
            {latestTrip.bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {booking.passenger.firstName} {booking.passenger.lastName}
                  </p>
                  {booking.passenger.phoneNumber && (
                    <a href={`tel:${booking.passenger.phoneNumber}`} className="text-xs text-primary-600 hover:underline">
                      {booking.passenger.phoneNumber}
                    </a>
                  )}
                </div>
                <AttendanceToggle
                  bookingId={booking.id}
                  currentStatus={booking.status as string}
                />
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
            {latestTrip.bookings.length} passenger(s) booked ·{' '}
            {latestTrip.bookings.filter((b) => b.status === 'COMPLETED').length} confirmed present
          </div>
        </div>
      )}
    </div>
  )
}
