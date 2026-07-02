'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { toggleDriverStatus } from '@/app/actions/driver'
import { assignDriverToTrip } from '@/app/actions/trips'
import LiveMap from '@/components/shared/LiveMapWrapper'

type TripRequest = {
  requestId: string
  tripId: string
  passengerId: string
  pickup: { lat: number; lng: number; name: string }
  dropoff: { lat: number; lng: number; name: string }
  price: number
}

export default function DriverLivePanel({
  driverId,
  initialStatus,
}: {
  driverId: string
  initialStatus: string
}) {
  const { emit, on } = useSocket()
  const [status, setStatus] = useState(initialStatus)
  const [requests, setRequests] = useState<TripRequest[]>([])
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Listen for incoming trip requests
  useEffect(() => {
    const off = on('new-trip-request', (data) => {
      setRequests((prev) => {
        if (prev.find((r) => r.requestId === data.requestId)) return prev
        return [data, ...prev]
      })
    })
    return off
  }, [on])

  // Start/stop GPS tracking based on online status
  useEffect(() => {
    if (status !== 'ONLINE') {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    if (!navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords
        setCoords({ lat: latitude, lng: longitude })
        emit('driver-status', { driverId, status: 'ONLINE' })
        // Broadcast location to active trip room only
        if (activeTripId) {
          emit('driver-location', {
            tripId: activeTripId,
            driverId,
            latitude,
            longitude,
            accuracy: accuracy ?? undefined,
            speed: speed ?? undefined,
          })
        }
      },
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [status, driverId, emit, activeTripId])

  const handleToggle = async () => {
    setToggling(true)
    const result = await toggleDriverStatus(status)
    if (result.success) {
      const newStatus = result.status as string
      setStatus(newStatus)
      emit('driver-status', { driverId, status: newStatus })
    }
    setToggling(false)
  }

  const handleAccept = async (req: TripRequest) => {
    const result = await assignDriverToTrip({
      tripId: req.tripId,
      driverId,
    })
    if (!result.success) {
      alert(result.error || 'Could not accept ride. It may have been taken by another driver.')
      setRequests((prev) => prev.filter((r) => r.requestId !== req.requestId))
      return
    }
    emit('accept-trip', { requestId: req.requestId, driverId, tripId: req.tripId })
    emit('join-trip', req.tripId)
    emit('driver-status', { driverId, status: 'DRIVER_ASSIGNED', tripId: req.tripId })
    setActiveTripId(req.tripId)
    setRequests((prev) => prev.filter((r) => r.requestId !== req.requestId))
  }

  const handleDecline = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.requestId !== requestId))
  }

  const isOnline = status === 'ONLINE'

  return (
    <div className="space-y-4">
      {/* Status Toggle */}
      <div className={`card flex items-center justify-between ${isOnline ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <div>
            <p className="font-semibold text-gray-900">{isOnline ? 'You are Online' : 'You are Offline'}</p>
            {isOnline && !coords && (
              <p className="text-xs text-yellow-600">Acquiring GPS...</p>
            )}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
            isOnline
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {toggling ? '...' : isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* GPS Map */}
      {isOnline && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Your Location</h3>
            {coords && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            )}
          </div>
          <LiveMap
            driverLocation={coords}
            height="250px"
          />
          {!coords && (
            <p className="text-xs text-gray-500 text-center">Allow location access to see yourself on the map.</p>
          )}
        </div>
      )}

      {/* Trip Requests */}
      {isOnline && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Incoming Requests ({requests.length})
          </h3>
          {requests.length === 0 ? (
            <div className="card text-center py-6 text-gray-400 text-sm">
              <p>Waiting for ride requests...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.requestId} className="card border-blue-200 bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">New Ride Request</p>
                      <p className="text-sm font-medium text-gray-900">
                        📍 {req.pickup.name}
                      </p>
                      <p className="text-sm text-gray-700">🏁 {req.dropoff.name}</p>
                      <p className="font-bold text-green-700 mt-1">
                        R{(req.price / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleAccept(req)}
                        className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(req.requestId)}
                        className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
