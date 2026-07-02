'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import Link from 'next/link'

export default function WaitingPage() {
  const router = useRouter()
  const params = useSearchParams()
  const requestId = params.get('requestId') ?? ''
  const tripId = params.get('tripId') ?? ''
  const bookingId = params.get('bookingId') ?? ''
  const pickup = params.get('pickup') ?? 'Your location'
  const dropoff = params.get('dropoff') ?? 'Destination'
  const { emit, on } = useSocket()

  const [elapsed, setElapsed] = useState(0)
  const [driverCount] = useState(Math.floor(Math.random() * 4) + 1)
  const [accepted, setAccepted] = useState(false)

  // Tick elapsed time
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Join trip room for live updates
  useEffect(() => {
    if (tripId) emit('join-trip', tripId)
  }, [tripId, emit])

  // Listen for driver acceptance
  useEffect(() => {
    const off = on('trip-accepted', (data) => {
      if (data.requestId === requestId) {
        setAccepted(true)
        const targetId = bookingId || data.tripId || tripId
        setTimeout(() => router.push(`/passenger/trips/${targetId}`), 1500)
      }
    })
    return off
  }, [on, requestId, tripId, bookingId, router])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8">
      <div className="card text-center space-y-4">
        {accepted ? (
          <>
            <p className="text-5xl">🎉</p>
            <h2 className="text-xl font-bold text-gray-900">Driver Found!</h2>
            <p className="text-gray-600 text-sm">Redirecting to your trip...</p>
          </>
        ) : (
          <>
            {/* Animated spinner */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Finding your driver...</h2>
            <p className="text-gray-500 text-sm">
              {driverCount} driver{driverCount !== 1 ? 's' : ''} nearby · {mins}:{secs.toString().padStart(2, '0')} elapsed
            </p>

            <div className="rounded-lg bg-gray-50 p-4 text-sm text-left space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-bold">●</span>
                <span className="text-gray-700 font-medium">Pickup:</span>
                <span className="text-gray-600 truncate">{pickup}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">●</span>
                <span className="text-gray-700 font-medium">Dropoff:</span>
                <span className="text-gray-600 truncate">{dropoff}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-gray-400">
              <p>Estimated wait: 2–5 minutes</p>
              <p>Your request has been sent to nearby drivers</p>
            </div>
          </>
        )}
      </div>

      {!accepted && (
        <Link
          href="/passenger/trips"
          className="block text-center text-sm text-red-600 hover:underline"
        >
          Cancel request
        </Link>
      )}
    </div>
  )
}
