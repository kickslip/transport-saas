import { prisma } from '@/lib/db'
import Link from 'next/link'
import TenantToggle from './TenantToggle'

export default async function AdminTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, trips: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tenants ({tenants.length})</h1>
        <Link href="/admin/tenants/new" className="btn-primary text-sm px-4 py-2">+ New Tenant</Link>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Slug', 'Email', 'Users', 'Trips', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{t.slug}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.contactEmail}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{t._count.users}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{t._count.trips}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                  <Link href={`/admin/tenants/${t.id}/edit`} className="text-xs text-primary-600 hover:underline">Edit</Link>
                  <TenantToggle tenantId={t.id} isActive={t.isActive} />
                </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && (
          <div className="text-center py-10 text-gray-400">No tenants yet</div>
        )}
      </div>
    </div>
  )
}
