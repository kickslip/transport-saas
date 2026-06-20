import { prisma } from '@/lib/db'

export default async function AdminSettingsPage() {
  const tenants = await prisma.tenant.findMany({
    include: { tenantBilling: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>

      {/* Platform fees */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Platform Fee Configuration</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500 text-xs uppercase font-medium mb-1">Passenger Booking Fee</p>
            <p className="text-2xl font-bold text-gray-900">
              {process.env.PLATFORM_BOOKING_FEE ?? '7'}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Set via PLATFORM_BOOKING_FEE env var</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500 text-xs uppercase font-medium mb-1">Default SaaS Fee / Vehicle</p>
            <p className="text-2xl font-bold text-gray-900">
              R{process.env.DEFAULT_TENANT_SAAS_FEE ?? '200'}/mo
            </p>
            <p className="text-xs text-gray-400 mt-1">Set via DEFAULT_TENANT_SAAS_FEE env var</p>
          </div>
        </div>
      </div>

      {/* Tenant billing settings */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Tenant Billing Settings</h2>
        {tenants.length === 0 ? (
          <p className="text-gray-400 text-sm">No tenants configured</p>
        ) : (
          <div className="divide-y">
            {tenants.map((t) => (
              <div key={t.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">Billing day: {t.tenantBilling?.billingDay ?? 1} · Cycle: {t.tenantBilling?.billingCycle ?? 'MONTHLY'}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-gray-700">
                    R{(parseInt(process.env.DEFAULT_TENANT_SAAS_FEE ?? '20000') / 100).toFixed(2)}/mo
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
