'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icon issue in Next.js
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const driverIcon = L.divIcon({
  className: 'custom-driver-marker',
  html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

interface Location {
  lat: number
  lng: number
  accuracy?: number
  timestamp?: string
}

interface DriverLocation extends Location {
  driverId: string
  driverName?: string
  speed?: number
}

interface LiveMapProps {
  center: { lat: number; lng: number }
  zoom?: number
  pickup?: Location
  dropoff?: Location
  driverLocation?: DriverLocation
  route?: Location[]
  height?: string
  showTraffic?: boolean
}

// Component to update map center
function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom())
  }, [center, map])
  return null
}

export default function LiveMap({
  center,
  zoom = 13,
  pickup,
  dropoff,
  driverLocation,
  route,
  height = '400px',
  showTraffic = false,
}: LiveMapProps) {
  const [mapCenter, setMapCenter] = useState(center)

  // Update center when driver moves
  useEffect(() => {
    if (driverLocation) {
      setMapCenter({ lat: driverLocation.lat, lng: driverLocation.lng })
    }
  }, [driverLocation])

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={mapCenter} />

        {/* Pickup Marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={icon}>
            <Popup>
              <div>
                <p className="font-semibold">Pickup Location</p>
                {pickup.accuracy && (
                  <p className="text-sm text-gray-600">Accuracy: {pickup.accuracy}m</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff Marker */}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={icon}>
            <Popup>
              <div>
                <p className="font-semibold">Dropoff Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Driver Marker */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <div>
                <p className="font-semibold">{driverLocation.driverName || 'Driver'}</p>
                {driverLocation.speed !== undefined && (
                  <p className="text-sm text-gray-600">Speed: {driverLocation.speed.toFixed(1)} km/h</p>
                )}
                {driverLocation.timestamp && (
                  <p className="text-xs text-gray-500">
                    Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline */}
        {route && route.length > 0 && (
          <Polyline
            positions={route.map((loc) => [loc.lat, loc.lng])}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  )
}

// Hook for tracking driver location
export function useDriverLocationTracking(
  tripId: string,
  socket: any,
  onLocationUpdate?: (location: DriverLocation) => void
) {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null)

  useEffect(() => {
    if (!socket) return

    // Join trip room
    socket.emit('join-trip', tripId)

    // Listen for location updates
    socket.on('location-update', (location: DriverLocation) => {
      setDriverLocation(location)
      onLocationUpdate?.(location)
    })

    return () => {
      socket.emit('leave-trip', tripId)
      socket.off('location-update')
    }
  }, [tripId, socket, onLocationUpdate])

  return driverLocation
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(value: number): number {
  return (value * Math.PI) / 180
}

// Estimate arrival time based on distance and average speed
export function estimateArrivalTime(
  distanceKm: number,
  averageSpeedKmh: number = 30
): number {
  // Returns minutes
  return Math.round((distanceKm / averageSpeedKmh) * 60)
}
