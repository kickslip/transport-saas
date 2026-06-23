import { prisma } from '@/lib/db'

async function getRevenueByMonth() {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      start: d,
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
    }
  })

  const data = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const agg = await prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: start, lt: end } },
        _sum: { amount: true },
        _count: true,
      })
      return { label, total: agg._sum.amount ?? 0, count: agg._count }
    }),
  )
  return data
}

async function getTopTenants() {
  const tenants = await prisma.tenant.findMany({
    include: { _count: { select: { trips: true, users: true } } },
    orderBy: { trips: { _count: 'desc' } },
    take: 5,
  })
  return tenants
}

async function getBookingStatusBreakdown() {
  const groups = await prisma.booking.groupBy({
    by: ['status'],
    _count: { id: true },
  })
  return groups.map((g) => ({ status: g.status, count: g._count.id }))
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">
            {d.value > 0 ? `R${(d.value / 100).toFixed(0)}` : '—'}
          </span>
          <div
            className="w-full bg-primary-500 rounded-t-sm transition-all"
            style={{ height: `${Math.max((d.value / max) * 120, 4)}px` }}
          />
          <span className="text-xs text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

const statusColor: Record<string, string> = {
  COMPLETED: 'bg-green-500',
  PENDING: 'bg-yellow-400',
  CONFIRMED: 'bg-blue-400',
  IN_PROGRESS: 'bg-indigo-500',
  CANCELLED_BY_PASSENGER: 'bg-red-400',
  CANCELLED_BY_DRIVER: 'bg-red-600',
  NO_SHOW: 'bg-orange-400',
}

export default async function AdminAnalyticsPage() {
  const [revenue, topTenants, bookingBreakdown] = await Promise.all([
    getRevenueByMonth(),
    getTopTenants(),
    getBookingStatusBreakdown(),
  ])

  const totalRevenue = revenue.reduce((s, d) => s + d.total, 0)
  const totalBookings = bookingBreakdown.reduce((s, d) => s + d.count, 0)
  const completedCount = bookingBreakdown.find((b) => b.status === 'COMPLETED')?.count ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Analytics & Revenue</h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <p className="text-sm text-gray-500">Total Revenue (6 mo)</p>
          <p className="text-3xl font-bold text-primary-600">R{(totalRevenue / 100).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {totalBookings > 0 ? ((completedCount / totalBookings) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-6">Monthly Revenue (Payments Verified)</h2>
        <BarChart data={revenue.map((d) => ({ label: d.label, value: d.total }))} />
      </div>

      {/* Booking status breakdown */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Booking Status Breakdown</h2>
        <div className="space-y-2">
          {bookingBreakdown
            .sort((a, b) => b.count - a.count)
            .map((b) => (
              <div key={b.status} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-sm flex-none ${statusColor[b.status] ?? 'bg-gray-400'}`} />
                <span className="text-sm text-gray-700 w-52">{b.status.replace(/_/g, ' ')}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${statusColor[b.status] ?? 'bg-gray-400'}`}
                    style={{ width: `${totalBookings > 0 ? (b.count / totalBookings) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-10 text-right">{b.count}</span>
              </div>
            ))}
          {bookingBreakdown.length === 0 && (
            <p className="text-gray-400 text-sm">No bookings yet</p>
          )}
        </div>
      </div>

      {/* Top tenants by trips */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Top Tenants by Activity</h2>
        <div className="space-y-3">
          {topTenants.map((t, i) => (
            <div key={t.id} className="flex items-center gap-4">
              <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t._count.users} users</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-700">{t._count.trips} trips</p>
              </div>
            </div>
          ))}
          {topTenants.length === 0 && <p className="text-gray-400 text-sm">No data yet</p>}
        </div>
      </div>
    </div>
  )
}
