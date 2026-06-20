import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import DriverLivePanel from '@/components/driver/DriverLivePanel'

export default async function DriverDashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  const [user, completedToday, totalTrips, upcomingScheduled] = await Promise.all([
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, driverStatus: true } })
      : null,
    userId
      ? prisma.trip.count({
          where: {
            driverId: userId,
            status: 'COMPLETED',
            actualEndTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }).catch(() => 0)
      : 0,
    userId
      ? prisma.trip.count({ where: { driverId: userId, status: 'COMPLETED' } }).catch(() => 0)
      : 0,
    userId
      ? prisma.trip.findMany({
          where: {
            driverId: userId,
            status: 'SCHEDULED',
            scheduledStartTime: { gte: new Date() },
          },
          orderBy: { scheduledStartTime: 'asc' },
          take: 3,
          include: { bookings: { select: { id: true } } },
        }).catch(() => [])
      : [],
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName ?? 'Driver'} 👋
        </h1>
      </div>

      {/* Live Status Panel */}
      {userId && (
        <DriverLivePanel
          driverId={userId}
          initialStatus={user?.driverStatus ?? 'OFFLINE'}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Trips Today</p>
          <p className="text-2xl font-bold text-green-600">{completedToday}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Completed</p>
          <p className="text-2xl font-bold text-primary-600">{totalTrips}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Upcoming Scheduled</p>
          <p className="text-2xl font-bold text-gray-700">{upcomingScheduled.length}</p>
        </div>
      </div>

      {/* Upcoming Scheduled Trips */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Scheduled Trips</h2>
          <Link href="/driver/schedules" className="text-primary-600 text-sm hover:underline">
            Manage →
          </Link>
        </div>
        {upcomingScheduled.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">No scheduled trips coming up.</p>
            <Link href="/driver/schedules/new" className="text-primary-600 hover:underline mt-1 inline-block text-sm">
              Create a schedule →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingScheduled.map((trip) => (
              <div key={trip.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {trip.startLocationName} → {trip.endLocationName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(trip.scheduledStartTime).toLocaleString()} ·{' '}
                    {(trip as any).bookings.length} passenger(s)
                  </p>
                </div>
                <p className="font-semibold text-gray-700 text-sm">R{(trip.totalPrice / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
