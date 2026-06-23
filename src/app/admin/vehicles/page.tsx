import { prisma } from '@/lib/db'

export default async function AdminVehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Vehicles ({vehicles.length})</h1>
      </div>

      <div className="card overflow-hidden p-0 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Registration', 'Make / Model', 'Year', 'Type', 'Capacity', 'Tenant', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{v.registrationNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{v.make} {v.model}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{v.year}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{v.vehicleType}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{v.capacity}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{v.tenant.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {v.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vehicles.length === 0 && <div className="text-center py-10 text-gray-400">No vehicles yet</div>}
      </div>
    </div>
  )
}
