import { prisma } from '@/lib/db'

const ACTION_COLORS: Record<string, string> = {
  TRIP_STARTED: 'bg-blue-100 text-blue-700',
  TRIP_COMPLETED: 'bg-green-100 text-green-700',
  PAYMENT_VERIFIED: 'bg-emerald-100 text-emerald-700',
  PAYMENT_REJECTED: 'bg-red-100 text-red-700',
  PAYMENT_SUBMITTED: 'bg-yellow-100 text-yellow-700',
  REVIEW_SUBMITTED: 'bg-purple-100 text-purple-700',
  BOOKING_CREATED: 'bg-indigo-100 text-indigo-700',
  BOOKING_CANCELLED: 'bg-orange-100 text-orange-700',
  TENANT_CREATED: 'bg-cyan-100 text-cyan-700',
  TENANT_SUSPENDED: 'bg-red-100 text-red-700',
  TENANT_UPDATED: 'bg-gray-100 text-gray-700',
  USER_DEACTIVATED: 'bg-red-100 text-red-700',
  USER_ACTIVATED: 'bg-green-100 text-green-700',
}

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { firstName: true, lastName: true, email: true, role: true } },
    },
  }).catch(() => [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log (POPIA)</h1>
        <p className="text-sm text-gray-400">{logs.length} recent entries</p>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Time', 'Action', 'User', 'Entity', 'IP'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">No audit entries yet</td>
              </tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {log.user ? (
                    <div>
                      <p className="font-medium text-gray-900">{log.user.firstName} {log.user.lastName}</p>
                      <p className="text-xs text-gray-400">{log.user.role}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400">System</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {log.entityType && <span className="font-medium">{log.entityType}</span>}
                  {log.entityId && <span className="text-gray-400"> · {log.entityId.slice(0, 10)}…</span>}
                </td>
                <td className="px-4 py-2 text-xs text-gray-400">{log.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
