import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const stats = await prisma.$transaction([
    prisma.tenant.count(),
    prisma.user.count({ where: { role: 'DRIVER' } }),
    prisma.user.count({ where: { role: 'PASSENGER' } }),
    prisma.vehicle.count(),
    prisma.trip.count({ where: { status: { not: 'COMPLETED' } } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
  ])

  const [tenantCount, driverCount, passengerCount, vehicleCount, activeTripCount, pendingBookingCount] = stats

  const recentTrips = await prisma.trip.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      driver: { select: { firstName: true, lastName: true } },
      tenant: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Link href="/admin/tenants/new" className="btn-primary">
          + New Tenant
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Tenants</p>
          <p className="text-2xl font-bold text-primary-600">{tenantCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Drivers</p>
          <p className="text-2xl font-bold text-primary-600">{driverCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Passengers</p>
          <p className="text-2xl font-bold text-primary-600">{passengerCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Vehicles</p>
          <p className="text-2xl font-bold text-primary-600">{vehicleCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active Trips</p>
          <p className="text-2xl font-bold text-green-600">{activeTripCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pending Bookings</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingBookingCount}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Trips</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTrips.map((trip) => (
                <tr key={trip.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{trip.tenant.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {trip.driver.firstName} {trip.driver.lastName}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {trip.startLocationName} → {trip.endLocationName}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      trip.tripType === 'ON_DEMAND' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {trip.tripType === 'ON_DEMAND' ? 'On-Demand' : 'Scheduled'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      trip.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
