import { prisma } from '@/lib/db'

const statusColor: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string }
}) {
  const where: any = {}
  if (searchParams.status) where.status = searchParams.status
  if (searchParams.type) where.tripType = searchParams.type

  const trips = await prisma.trip.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      driver: { select: { firstName: true, lastName: true } },
      tenant: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Trips ({trips.length})</h1>
      </div>

      <form method="GET" className="flex flex-wrap gap-3">
        <select name="status" defaultValue={searchParams.status ?? ''} className="input flex-1 min-w-[9rem]">
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select name="type" defaultValue={searchParams.type ?? ''} className="input flex-1 min-w-[9rem]">
          <option value="">All Types</option>
          <option value="ON_DEMAND">On-Demand</option>
          <option value="SCHEDULED">Scheduled</option>
        </select>
        <button type="submit" className="btn-primary px-4">Filter</button>
      </form>

      <div className="card overflow-hidden p-0 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Tenant', 'Driver', 'Route', 'Type', 'Bookings', 'Price', 'Status', 'Date'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trips.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{t.tenant.name}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.driver.firstName} {t.driver.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{t.startLocationName} → {t.endLocationName}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.tripType === 'ON_DEMAND' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {t.tripType === 'ON_DEMAND' ? 'On-Demand' : 'Scheduled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{t._count.bookings}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">R{(t.totalPrice / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[t.status as string] ?? 'bg-gray-100 text-gray-600'}`}>
                    {t.status as string}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trips.length === 0 && <div className="text-center py-10 text-gray-400">No trips found</div>}
      </div>
    </div>
  )
}
