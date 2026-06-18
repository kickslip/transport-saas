'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

export default function DriverDashboardPage() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Initialize Socket.io connection
    const newSocket = io('/', {
      path: '/api/socket',
    })

    newSocket.on('connect', () => {
      console.log('Connected to socket server')
    })

    newSocket.on('new-trip-request', (data) => {
      console.log('New trip request:', data)
      // Show notification to driver
      alert(`New trip request! From: ${data.pickup.name} To: ${data.dropoff.name}`)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  // Update driver location periodically when online
  useEffect(() => {
    if (!isOnline || !socket) return

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setLocation({ lat: latitude, lng: longitude })
            
            socket.emit('driver-location', {
              driverId: session?.user?.id,
              latitude,
              longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
            })
          },
          (error) => {
            console.error('Geolocation error:', error)
          }
        )
      }
    }

    // Update location every 10 seconds
    const interval = setInterval(updateLocation, 10000)
    updateLocation() // Initial update

    return () => clearInterval(interval)
  }, [isOnline, socket, session])

  const toggleOnlineStatus = () => {
    const newStatus = !isOnline
    setIsOnline(newStatus)
    
    if (socket) {
      socket.emit('driver-status', {
        driverId: session?.user?.id,
        status: newStatus ? 'ONLINE' : 'OFFLINE',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
        <button
          onClick={toggleOnlineStatus}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isOnline
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isOnline ? '🟢 Online - Accepting Trips' : '⚪ Go Online'}
        </button>
      </div>

      {location && (
        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-blue-800">
            <span className="font-semibold">Current Location:</span>{' '}
            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Today's Earnings</p>
          <p className="text-2xl font-bold text-green-600">R0.00</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Trips Completed</p>
          <p className="text-2xl font-bold text-primary-600">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Rating</p>
          <p className="text-2xl font-bold text-yellow-500">⭐ 0.0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Driver Tier</p>
          <p className="text-2xl font-bold text-gray-700">Free</p>
        </div>
      </div>

      {/* Active Trip or Available Trips */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isOnline ? 'Waiting for trip requests...' : 'Go online to receive trip requests'}
        </h2>
        
        {!isOnline && (
          <p className="text-gray-600">
            When you go online, you'll be able to accept on-demand ride requests and view your scheduled trips.
          </p>
        )}

        {isOnline && (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">No active trips. Waiting for requests...</p>
          </div>
        )}
      </div>

      {/* Upcoming Scheduled Trips */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Scheduled Trips</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No scheduled trips for today.</p>
          <a href="/driver/schedules" className="text-primary-600 hover:text-primary-500 mt-2 inline-block">
            View your schedules →
          </a>
        </div>
      </div>
    </div>
  )
}
