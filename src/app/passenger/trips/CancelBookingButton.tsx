'use client'

import { useState } from 'react'
import { cancelBooking } from '@/app/actions/booking'
import { useRouter } from 'next/navigation'

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return
    setLoading(true)
    const result = await cancelBooking(bookingId)
    setLoading(false)
    if (result.success) router.refresh()
    else alert(result.error || 'Failed to cancel')
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-xs text-red-600 hover:text-red-800 mt-1"
    >
      {loading ? 'Cancelling...' : 'Cancel'}
    </button>
  )
}
