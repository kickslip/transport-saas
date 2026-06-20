import { prisma } from '@/lib/db'
import PaymentActions from './PaymentActions'

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const where: any = {}
  if (searchParams.status) where.status = searchParams.status

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  const pendingEft = payments.filter((p) => p.method === 'EFT' && p.status === 'PENDING')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payments ({payments.length})</h1>
      </div>

      {pendingEft.length > 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm font-semibold text-yellow-800">
            ⚠️ {pendingEft.length} EFT payment{pendingEft.length > 1 ? 's' : ''} awaiting verification
          </p>
        </div>
      )}

      <form method="GET" className="flex gap-3">
        <select name="status" defaultValue={searchParams.status ?? ''} className="input w-44">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
        <button type="submit" className="btn-primary px-4">Filter</button>
      </form>

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Amount', 'Method', 'Reference', 'Proof', 'Status', 'Date', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <p className="font-medium text-gray-900">{p.user.firstName} {p.user.lastName}</p>
                  <p className="text-gray-400 text-xs">{p.user.email}</p>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">R{(p.amount / 100).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.method === 'EFT' ? 'bg-blue-50 text-blue-700' : p.method === 'CASH' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.method}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 font-mono">{p.reference ?? '—'}</td>
                <td className="px-4 py-3 text-sm">
                  {(p as any).proofOfPaymentUrl ? (
                    <a
                      href={(p as any).proofOfPaymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 hover:underline text-xs"
                    >
                      View ↗
                    </a>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {p.status === 'PENDING' && <PaymentActions paymentId={p.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <div className="text-center py-10 text-gray-400">No payments found</div>}
      </div>
    </div>
  )
}
