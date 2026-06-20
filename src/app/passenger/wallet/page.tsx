import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import EftUploadForm from './EftUploadForm'

export default async function WalletPage() {
  const session = await auth()

  const [payments, balanceAgg] = session?.user?.id
    ? await Promise.all([
        prisma.payment.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }).catch(() => []),
        prisma.payment.aggregate({
          where: { userId: session.user.id, status: 'COMPLETED', method: 'EFT' },
          _sum: { amount: true },
        }).catch(() => ({ _sum: { amount: 0 } })),
      ])
    : [[], { _sum: { amount: 0 } }]

  const walletBalance = balanceAgg._sum.amount ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wallet & Payments</h1>

      {/* Balance Card */}
      <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <p className="text-sm opacity-80">Wallet Balance</p>
        <p className="text-4xl font-bold mt-1">R{(walletBalance / 100).toFixed(2)}</p>
        <p className="text-xs opacity-70 mt-2">Top up via EFT — send proof of payment below</p>
      </div>

      {/* Top-up via EFT */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Top Up via EFT</h2>
        <EftUploadForm userId={session?.user?.id ?? ''} />
      </div>

      {/* Payment History */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            <p className="text-3xl mb-2">💳</p>
            <p>No payments yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {p.method} payment
                  </p>
                  <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">R{(p.amount / 100).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
