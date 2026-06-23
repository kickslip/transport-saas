import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import ClaimScheduleButton from './ClaimScheduleButton'

function formatDays(days: number[]) {
  const names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((d) => names[d]).join(', ')
}

export default async function DriverSchedulesPage() {
  const session = await auth()

  const [mySchedules, pendingSchedules] = session?.user?.id && session.user.tenantId
    ? await Promise.all([
        prisma.tripSchedule.findMany({
          where: { driverId: session.user.id },
          orderBy: { createdAt: 'desc' },
        }).catch(() => []),
        prisma.tripSchedule.findMany({
          where: {
            driverId: null,
            status: 'PENDING',
            tenantId: session.user.tenantId,
          },
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { firstName: true, lastName: true } } },
        }).catch(() => []),
      ])
    : [[], []]

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">My Schedules</h1>
        <Link href="/driver/schedules/new" className="btn-primary text-sm px-4 py-2">
          + Create Schedule
        </Link>
      </div>

      {/* My schedules */}
      {mySchedules.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium">No schedules yet</p>
          <p className="text-sm mt-1">Create a recurring route or claim a community route</p>
          <Link href="/driver/schedules/new" className="btn-primary inline-block mt-4">
            Create First Schedule
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {mySchedules.map((s) => (
            <div key={s.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    <p>📍 {s.startLocationName} → {s.endLocationName}</p>
                    <p>🕐 {s.startTime} · {formatDays(s.daysOfWeek)}</p>
                    <p>💰 R{(s.basePrice / 100).toFixed(2)} per seat</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Link href={`/driver/schedules/${s.id}`} className="text-sm text-primary-600 hover:underline">
                    Manage →
                  </Link>
                  <Link href={`/driver/schedules/${s.id}/manifest`} className="text-xs text-gray-500 hover:underline">
                    📋 Manifest
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending community routes */}
      {pendingSchedules.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Community Routes Awaiting Driver</h2>
          <div className="space-y-4">
            {pendingSchedules.map((s) => (
              <div key={s.id} className="card border-l-4 border-l-yellow-400">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{s.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <p>📍 {s.startLocationName} → {s.endLocationName}</p>
                      <p>🕐 {s.startTime} · {formatDays(s.daysOfWeek)}</p>
                      <p>💰 R{(s.basePrice / 100).toFixed(2)} per seat</p>
                      {s.createdBy && (
                        <p className="text-xs text-gray-500">
                          Requested by {s.createdBy.firstName} {s.createdBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <ClaimScheduleButton scheduleId={s.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
