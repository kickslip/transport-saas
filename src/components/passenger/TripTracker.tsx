'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import LiveMap from '@/components/shared/LiveMapWrapper'
import { calculateDistance } from '@/components/maps/LiveMap'

type DriverLocation = {
  driverId: string
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  timestamp: string
}

export default function TripTracker({
  tripId,
  driverName,
  driverPhone,
  pickup,
  dropoff,
}: {
  tripId: string
  driverName: string
  driverPhone?: string | null
  pickup?: { lat: number; lng: number; name: string } | null
  dropoff?: { lat: number; lng: number; name: string } | null
}) {
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

  const eta =
    driverLoc && pickup && driverLoc.speed && driverLoc.speed > 0
      ? Math.round(
          (calculateDistance(driverLoc.latitude, driverLoc.longitude, pickup.lat, pickup.lng) /
            (driverLoc.speed * 3.6)) *
            60,
        )
      : null

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
        {eta != null && (
          <p className="text-gray-700">
            <span className="font-medium">ETA to pickup:</span>{' '}
            {eta < 1 ? '< 1 min' : `${eta} min`}
          </p>
        )}
      </div>

      {driverPhone && (
        <a
          href={`tel:${driverPhone}`}
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
        >
          📞 Contact driver
        </a>
      )}

      <LiveMap
        driverLocation={driverLoc ? { lat: driverLoc.latitude, lng: driverLoc.longitude } : null}
        pickupLocation={pickup}
        dropoffLocation={dropoff}
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
