'use client'

import { useState } from 'react'
import { claimSchedule } from '@/app/actions/driver'
import { useRouter } from 'next/navigation'

export default function ClaimScheduleButton({ scheduleId }: { scheduleId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleClick = async () => {
    setLoading(true)
    setMessage('')
    const result = await claimSchedule(scheduleId)
    setLoading(false)
    if (result.success) {
      setMessage('✅ Claimed!')
      router.refresh()
    } else {
      setMessage(result.error ?? 'Failed')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-primary text-sm px-3 py-2 disabled:opacity-60"
      >
        {loading ? 'Claiming...' : 'Claim Route'}
      </button>
      {message && <span className="text-xs text-gray-600">{message}</span>}
    </div>
  )
}
