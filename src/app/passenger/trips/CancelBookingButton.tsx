'use client'

import { useState } from 'react'
import { cancelBooking } from '@/app/actions/booking'
import { useRouter } from 'next/navigation'

export default function CancelBookingButton({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const canCancel = ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE'].includes(status)

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return
    setLoading(true)
    const result = await cancelBooking(bookingId)
    setLoading(false)
    if (result.success) router.refresh()
    else alert(result.error || 'Failed to cancel')
  }

  if (!canCancel) return null

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
