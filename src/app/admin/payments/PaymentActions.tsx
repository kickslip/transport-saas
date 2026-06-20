'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyPayment, rejectPayment } from '@/app/actions/admin'

export default function PaymentActions({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handle = async (action: 'verify' | 'reject') => {
    setLoading(true)
    if (action === 'verify') await verifyPayment(paymentId)
    else await rejectPayment(paymentId)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle('verify')}
        disabled={loading}
        className="text-xs font-medium text-green-600 hover:bg-green-50 px-2 py-0.5 rounded"
      >
        ✅ Verify
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={loading}
        className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-0.5 rounded"
      >
        ✗ Reject
      </button>
    </div>
  )
}
