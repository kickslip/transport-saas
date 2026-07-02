import { prisma } from '@/lib/db'
import TenantBillingForm from './TenantBillingForm'

export default async function AdminSettingsPage() {
  const tenants = await prisma.tenant.findMany({
    include: { tenantBilling: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Platform Settings</h1>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Tenant Billing Settings</h2>
        {tenants.length === 0 ? (
          <p className="text-gray-400 text-sm">No tenants configured</p>
        ) : (
          <div className="divide-y">
            {tenants.map((t) => (
              <TenantBillingForm
                key={t.id}
                tenantId={t.id}
                name={t.name}
                billing={t.tenantBilling}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
