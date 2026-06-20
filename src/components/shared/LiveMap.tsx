'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default Leaflet icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const passengerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

type Props = {
  driverLocation?: { lat: number; lng: number } | null
  pickupLocation?: { lat: number; lng: number; name: string } | null
  dropoffLocation?: { lat: number; lng: number; name: string } | null
  height?: string
}

export default function LiveMap({
  driverLocation,
  pickupLocation,
  dropoffLocation,
  height = '300px',
}: Props) {
  const defaultCenter: [number, number] = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : pickupLocation
    ? [pickupLocation.lat, pickupLocation.lng]
    : [-26.2041, 28.0473] // Johannesburg default

  return (
    <MapContainer
      center={defaultCenter}
      zoom={14}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Driver marker */}
      {driverLocation && (
        <>
          <RecenterMap lat={driverLocation.lat} lng={driverLocation.lng} />
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>🚗 Driver is here</Popup>
          </Marker>
        </>
      )}

      {/* Pickup marker */}
      {pickupLocation && (
        <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={passengerIcon}>
          <Popup>📍 Pickup: {pickupLocation.name}</Popup>
        </Marker>
      )}

      {/* Dropoff marker */}
      {dropoffLocation && (
        <Marker position={[dropoffLocation.lat, dropoffLocation.lng]}>
          <Popup>🏁 Dropoff: {dropoffLocation.name}</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
