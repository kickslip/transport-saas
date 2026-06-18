import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      path: '/api/socket',
      autoConnect: false,
    })
  }
  return socket
}

export const connectSocket = (): Socket => {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  return s
}

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
  }
}

// Socket event types for type safety
export interface ServerToClientEvents {
  'location-update': (data: {
    driverId: string
    latitude: number
    longitude: number
    accuracy?: number
    speed?: number
    timestamp: string
  }) => void
  
  'driver-status-update': (data: {
    driverId: string
    status: string
  }) => void
  
  'new-message': (data: {
    senderId: string
    receiverId: string
    content: string
    timestamp: string
  }) => void
  
  'new-trip-request': (data: {
    requestId: string
    passengerId: string
    pickup: { lat: number; lng: number; name: string }
    dropoff: { lat: number; lng: number; name: string }
    price: number
  }) => void
  
  'trip-accepted': (data: {
    requestId: string
    driverId: string
    tripId: string
  }) => void
}

export interface ClientToServerEvents {
  'join-trip': (tripId: string) => void
  'leave-trip': (tripId: string) => void
  'driver-location': (data: {
    tripId: string
    driverId: string
    latitude: number
    longitude: number
    accuracy?: number
    speed?: number
  }) => void
  'driver-status': (data: {
    driverId: string
    status: string
    tripId?: string
  }) => void
  'send-message': (data: {
    tripId: string
    senderId: string
    receiverId: string
    content: string
  }) => void
  'trip-request': (data: {
    requestId: string
    passengerId: string
    pickup: { lat: number; lng: number; name: string }
    dropoff: { lat: number; lng: number; name: string }
    price: number
  }) => void
  'accept-trip': (data: {
    requestId: string
    driverId: string
    tripId: string
  }) => void
}
