import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function DriverEarningsPage() {
  const session = await auth()

  const payments = session?.user?.id
    ? await prisma.payment.findMany({
        where: { userId: session.user.id, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }).catch(() => [])
    : []

  const totalCents = payments.reduce((sum, p) => sum + p.amount, 0)
  const thisMonth = payments.filter((p) => {
    const d = new Date(p.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthCents = thisMonth.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <a href="/driver/earnings/outstanding" className="text-sm text-orange-600 hover:underline font-medium">
          ⚠️ Outstanding Payments →
        </a>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-3xl font-bold text-green-600 mt-1">R{(totalCents / 100).toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">R{(monthCents / 100).toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Trips Paid</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{payments.length}</p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <p className="text-3xl mb-2">💰</p>
            <p>No completed payments yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {p.method} · {p.reference ?? 'No reference'}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="font-semibold text-green-700">+R{(p.amount / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
