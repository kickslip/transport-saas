import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const now = new Date()
  const year = parseInt(searchParams.year ?? String(now.getFullYear()))
  const month = parseInt(searchParams.month ?? String(now.getMonth()))

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

  const bookings = await prisma.booking.findMany({
    where: {
      passengerId: session.user.id,
      status: { in: ['CONFIRMED', 'IN_PROGRESS', 'PENDING'] },
      trip: {
        scheduledStartTime: { gte: monthStart, lte: monthEnd },
      },
    },
    include: {
      trip: { select: { scheduledStartTime: true, startLocationName: true, endLocationName: true } },
    },
    orderBy: { createdAt: 'asc' },
  }).catch(() => [])

  type Booking = (typeof bookings)[number]
  const byDay: Record<number, Booking[]> = {}
  for (const b of bookings) {
    const d = new Date(b.trip.scheduledStartTime).getDate()
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(b)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month) // 0 = Sunday
  const monthName = monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })

  const prevMonth = month === 0 ? `?month=11&year=${year - 1}` : `?month=${month - 1}&year=${year}`
  const nextMonth = month === 11 ? `?month=0&year=${year + 1}` : `?month=${month + 1}&year=${year}`

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
        <div className="flex items-center gap-3">
          <Link href={prevMonth} className="px-3 py-1 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            ← Prev
          </Link>
          <span className="font-semibold text-gray-800 text-sm">{monthName}</span>
          <Link href={nextMonth} className="px-3 py-1 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Next →
          </Link>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="card p-0 overflow-hidden">
        {/* Day labels */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {days.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-20 border-b border-r border-gray-100 bg-gray-50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday =
              day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
            const dayBookings = byDay[day] ?? []

            return (
              <div
                key={day}
                className={`min-h-20 border-b border-r border-gray-100 p-1.5 ${
                  isToday ? 'bg-primary-50' : ''
                }`}
              >
                <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary-700' : 'text-gray-500'}`}>
                  {day}
                </p>
                {dayBookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/passenger/trips/${b.id}`}
                    className="block text-xs bg-primary-100 text-primary-800 rounded px-1 py-0.5 mb-0.5 truncate hover:bg-primary-200 transition-colors"
                    title={`${b.trip.startLocationName} → ${b.trip.endLocationName}`}
                  >
                    {new Date(b.trip.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                    {b.trip.startLocationName.split(' ')[0]}
                  </Link>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming list for this month */}
      {bookings.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900">Trips This Month ({bookings.length})</h2>
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/passenger/trips/${b.id}`}
              className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {b.trip.startLocationName} → {b.trip.endLocationName}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(b.trip.scheduledStartTime).toLocaleString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                b.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {b.status.replace(/_/g, ' ')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
