'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import LiveMap from '@/components/shared/LiveMapWrapper'

type DriverLocation = {
  driverId: string
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  timestamp: string
}

export default function TripTracker({ tripId, driverName }: { tripId: string; driverName: string }) {
  const { emit, on } = useSocket()
  const [driverLoc, setDriverLoc] = useState<DriverLocation | null>(null)
  const [driverStatus, setDriverStatus] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Join the trip room
    emit('join-trip', tripId)
    setConnected(true)

    const offLoc = on('location-update', (data) => {
      setDriverLoc(data)
    })

    const offStatus = on('driver-status-update', (data) => {
      setDriverStatus(data.status)
    })

    return () => {
      emit('leave-trip', tripId)
      offLoc()
      offStatus()
    }
  }, [tripId, emit, on])

  return (
    <div className="card border-blue-200 bg-blue-50 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        <h3 className="font-semibold text-gray-900">Live Tracking</h3>
        <span className="text-xs text-gray-500">Trip #{tripId.slice(0, 8)}</span>
      </div>

      <div className="text-sm space-y-1">
        <p className="text-gray-700">
          <span className="font-medium">Driver:</span> {driverName}
        </p>
        {driverStatus && (
          <p className="text-gray-700">
            <span className="font-medium">Status:</span>{' '}
            <span className="capitalize">{driverStatus.replace(/_/g, ' ').toLowerCase()}</span>
          </p>
        )}
      </div>

      <LiveMap
        driverLocation={driverLoc ? { lat: driverLoc.latitude, lng: driverLoc.longitude } : null}
        height="220px"
      />

      {driverLoc && (
        <p className="text-xs text-gray-400">
          Updated {new Date(driverLoc.timestamp).toLocaleTimeString()}
          {driverLoc.speed != null && ` · ${(driverLoc.speed * 3.6).toFixed(1)} km/h`}
        </p>
      )}
      {!driverLoc && (
        <p className="text-xs text-gray-400">Waiting for driver location...</p>
      )}
    </div>
  )
}
