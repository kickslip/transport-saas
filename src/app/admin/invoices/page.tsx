import { prisma } from '@/lib/db'
import GenerateInvoiceButton from './GenerateInvoiceButton'

export default async function AdminInvoicesPage() {
  const [invoices, tenants] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { tenant: { select: { name: true } } },
    }).catch(() => []),
    prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }).catch(() => []),
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoices ({invoices.length})</h1>
      </div>

      {/* Generate invoices per tenant */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Generate Monthly Invoice</h2>
        <div className="flex flex-wrap gap-3">
          {tenants.map((t) => (
            <div key={t.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-700">{t.name}</span>
              <GenerateInvoiceButton tenantId={t.id} tenantName={t.name} />
            </div>
          ))}
          {tenants.length === 0 && <p className="text-sm text-gray-400">No active tenants</p>}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Invoice #', 'Tenant', 'Amount', 'Period', 'Status', 'Due Date'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{inv.tenant.name}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">R{(inv.totalAmount / 100).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(inv.periodStart).toLocaleDateString()} – {new Date(inv.periodEnd).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{inv.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <div className="text-center py-10 text-gray-400">No invoices yet</div>}
      </div>
    </div>
  )
}
