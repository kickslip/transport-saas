'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startTrip, completeTrip, enRouteTrip, arriveTrip, cancelTrip } from '@/app/actions/driver'

export default function TripControls({ tripId, status }: { tripId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handle = async (action: 'enRoute' | 'arrive' | 'start' | 'complete' | 'cancel') => {
    setLoading(true)
    const result =
      action === 'enRoute'
        ? await enRouteTrip(tripId)
        : action === 'arrive'
          ? await arriveTrip(tripId)
          : action === 'start'
            ? await startTrip(tripId)
            : action === 'complete'
              ? await completeTrip(tripId)
              : await cancelTrip(tripId)
    setLoading(false)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  const activeStatuses = ['PENDING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'SCHEDULED', 'IN_PROGRESS']
  if (!activeStatuses.includes(status)) return null

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {(status === 'PENDING_DRIVER' || status === 'DRIVER_ASSIGNED' || status === 'SCHEDULED') && (
        <button
          onClick={() => handle('enRoute')}
          disabled={loading}
          className="text-xs font-medium px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          {loading ? '...' : '🚗 En Route'}
        </button>
      )}
      {(status === 'DRIVER_EN_ROUTE' || status === 'SCHEDULED') && (
        <button
          onClick={() => handle('arrive')}
          disabled={loading}
          className="text-xs font-medium px-3 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          {loading ? '...' : '📍 Arrived'}
        </button>
      )}
      {(status === 'DRIVER_ARRIVED' || status === 'SCHEDULED') && (
        <button
          onClick={() => handle('start')}
          disabled={loading}
          className="text-xs font-medium px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          {loading ? '...' : '▶ Start Trip'}
        </button>
      )}
      {status === 'IN_PROGRESS' && (
        <button
          onClick={() => handle('complete')}
          disabled={loading}
          className="text-xs font-medium px-3 py-1 rounded-lg bg-gray-700 text-white hover:bg-gray-800"
        >
          {loading ? '...' : '✓ Complete'}
        </button>
      )}
      {status !== 'IN_PROGRESS' && status !== 'COMPLETED' && status !== 'CANCELLED' && (
        <button
          onClick={() => handle('cancel')}
          disabled={loading}
          className="text-xs font-medium px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
        >
          {loading ? '...' : 'Cancel'}
        </button>
      )}
    </div>
  )
}
