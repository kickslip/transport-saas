import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

function formatDays(days: number[]) {
  const names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((d) => names[d]).join(', ')
}

export default async function DriverSchedulesPage() {
  const session = await auth()

  const schedules = session?.user?.id
    ? await prisma.tripSchedule.findMany({
        where: { driverId: session.user.id },
        orderBy: { createdAt: 'desc' },
      }).catch(() => [])
    : []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Schedules</h1>
        <Link href="/driver/schedules/new" className="btn-primary text-sm px-4 py-2">
          + Create Schedule
        </Link>
      </div>

      {schedules.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium">No schedules yet</p>
          <p className="text-sm mt-1">Create a recurring route to pick up commuters daily</p>
          <Link href="/driver/schedules/new" className="btn-primary inline-block mt-4">
            Create First Schedule
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((s) => (
            <div key={s.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
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
    </div>
  )
}
