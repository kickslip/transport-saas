'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markAttendance } from '@/app/actions/driver'

export default function AttendanceToggle({
  bookingId,
  currentStatus,
}: {
  bookingId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isPresent = currentStatus === 'COMPLETED'

  const toggle = async () => {
    setLoading(true)
    await markAttendance(bookingId, !isPresent)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
        isPresent
          ? 'bg-green-500 border-green-500 text-white'
          : 'border-gray-300 text-gray-300 hover:border-green-400 hover:text-green-400'
      }`}
      title={isPresent ? 'Mark absent' : 'Mark present'}
    >
      {loading ? '…' : '✓'}
    </button>
  )
}
