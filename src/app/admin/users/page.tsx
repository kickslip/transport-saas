import { prisma } from '@/lib/db'
import UserActions from './UserActions'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; search?: string }
}) {
  const where: any = {}
  if (searchParams.role) where.role = searchParams.role
  if (searchParams.search) {
    where.OR = [
      { firstName: { contains: searchParams.search, mode: 'insensitive' } },
      { lastName: { contains: searchParams.search, mode: 'insensitive' } },
      { email: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }

  const [users, tenants] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { tenant: { select: { name: true } } },
    }),
    prisma.tenant.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Users ({users.length})</h1>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3">
        <input
          name="search"
          defaultValue={searchParams.search}
          placeholder="Search name or email..."
          className="input flex-1"
        />
        <select name="role" defaultValue={searchParams.role ?? ''} className="input w-40">
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="DRIVER">Driver</option>
          <option value="PASSENGER">Passenger</option>
        </select>
        <button type="submit" className="btn-primary px-4">Filter</button>
      </form>

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Email', 'Role', 'Tenant', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'DRIVER' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.tenant?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <UserActions userId={u.id} isActive={u.isActive} tenants={tenants} currentTenantId={u.tenantId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="text-center py-10 text-gray-400">No users found</div>}
      </div>
    </div>
  )
}
