'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collectCash } from '@/app/actions/driver'

export default function CashCollectButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handle = async () => {
    if (!confirm('Mark this booking as cash collected?')) return
    setLoading(true)
    const result = await collectCash(bookingId)
    setLoading(false)
    if (result.success) { setDone(true); router.refresh() }
    else alert(result.error)
  }

  if (done) return <span className="text-xs text-green-600 font-medium">✓ Cash collected</span>

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-xs font-medium px-3 py-1 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
    >
      {loading ? '...' : '💵 Collect Cash'}
    </button>
  )
}
