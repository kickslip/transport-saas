import { prisma } from '@/lib/db'

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  DRIVER_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED_BY_PASSENGER: 'bg-red-100 text-red-700',
  CANCELLED_BY_DRIVER: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const where: any = {}
  if (searchParams.status) where.status = searchParams.status

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      passenger: { select: { firstName: true, lastName: true, email: true } },
      trip: {
        select: {
          startLocationName: true, endLocationName: true,
          driver: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bookings ({bookings.length})</h1>
      </div>

      <form method="GET" className="flex gap-3">
        <select name="status" defaultValue={searchParams.status ?? ''} className="input w-52">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED_BY_PASSENGER">Cancelled by Passenger</option>
          <option value="CANCELLED_BY_DRIVER">Cancelled by Driver</option>
        </select>
        <button type="submit" className="btn-primary px-4">Filter</button>
      </form>

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Passenger', 'Route', 'Driver', 'Seats', 'Total', 'Status', 'Date'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <p className="font-medium text-gray-900">{b.passenger.firstName} {b.passenger.lastName}</p>
                  <p className="text-gray-400 text-xs">{b.passenger.email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                  {b.trip.startLocationName} → {b.trip.endLocationName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{b.trip.driver.firstName} {b.trip.driver.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{b.seatsBooked}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">R{(b.totalPrice / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <div className="text-center py-10 text-gray-400">No bookings found</div>}
      </div>
    </div>
  )
}
