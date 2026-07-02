import { getAvailableSchedules } from '@/app/actions/booking'
import { getTenantBookingFeePercent } from '@/app/actions/tenantFees'
import BookScheduleButton from './BookScheduleButton'
import ScheduleFilters from './ScheduleFilters'
import Link from 'next/link'

function formatDays(days: number[]) {
  const names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((d) => names[d]).join(', ')
}

function formatPrice(cents: number) {
  return `R${(cents / 100).toFixed(2)}`
}

export default async function ScheduledRoutesPage({
  searchParams,
}: {
  searchParams: { q?: string; day?: string }
}) {
  const schedules = await getAvailableSchedules({
    search: searchParams.q,
    day: searchParams.day ? parseInt(searchParams.day) : undefined,
  })

  const fees = new Map<string, number>()
  for (const schedule of schedules) {
    if (!fees.has(schedule.tenantId)) {
      const percent = await getTenantBookingFeePercent(schedule.tenantId)
      fees.set(schedule.tenantId, Math.round(schedule.basePrice * (percent / 100)))
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/passenger" className="text-gray-500 hover:text-gray-700">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Available Routes</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <ScheduleFilters />
        <Link
          href="/passenger/book/custom-schedule"
          className="btn-primary text-sm text-center py-2.5 min-h-[44px]"
        >
          + Request Custom Route
        </Link>
      </div>

      {schedules.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🚌</p>
          <p className="font-medium">No scheduled routes available yet</p>
          <p className="text-sm mt-1">Check back soon or request your own custom route</p>
          <Link href="/passenger/book/custom-schedule" className="btn-primary inline-block mt-4">
            Request Custom Route
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const isPending = schedule.status === 'PENDING'
            return (
              <div key={schedule.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-lg">{schedule.name}</h3>
                      {isPending && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending Driver
                        </span>
                      )}
                      {schedule.createdById && !isPending && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Community Route
                        </span>
                      )}
                    </div>
                    {schedule.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{schedule.description}</p>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="col-span-2">
                        <span className="text-gray-500">🪑 Available seats</span>
                        <p className="font-medium text-gray-800">
                          {(schedule as any).availableSeats != null
                            ? `${(schedule as any).availableSeats} seats`
                            : 'Open'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">📍 From</span>
                        <p className="font-medium text-gray-800">{schedule.startLocationName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">🏁 To</span>
                        <p className="font-medium text-gray-800">{schedule.endLocationName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">🕐 Departure</span>
                        <p className="font-medium text-gray-800">{schedule.startTime}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">📅 Days</span>
                        <p className="font-medium text-gray-800">{formatDays(schedule.daysOfWeek)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:ml-6 text-left sm:text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-primary-600">{formatPrice(schedule.basePrice)}</p>
                    <p className="text-xs text-gray-500">per trip</p>
                    {isPending ? (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        Waiting for driver assignment
                      </div>
                    ) : (
                      <BookScheduleButton
                        scheduleId={schedule.id}
                        basePrice={schedule.basePrice}
                        platformFee={fees.get(schedule.tenantId)}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
