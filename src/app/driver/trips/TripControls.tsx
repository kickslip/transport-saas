'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startTrip, completeTrip } from '@/app/actions/driver'

export default function TripControls({ tripId, status }: { tripId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handle = async (action: 'start' | 'complete') => {
    setLoading(true)
    const result = action === 'start' ? await startTrip(tripId) : await completeTrip(tripId)
    setLoading(false)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  if (status === 'SCHEDULED') {
    return (
      <button
        onClick={() => handle('start')}
        disabled={loading}
        className="text-xs font-medium px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700"
      >
        {loading ? '...' : '▶ Start Trip'}
      </button>
    )
  }

  if (status === 'IN_PROGRESS') {
    return (
      <button
        onClick={() => handle('complete')}
        disabled={loading}
        className="text-xs font-medium px-3 py-1 rounded-lg bg-gray-700 text-white hover:bg-gray-800"
      >
        {loading ? '...' : '✓ Complete'}
      </button>
    )
  }

  return null
}
