import { Server } from 'socket.io'
import { NextResponse } from 'next/server'

const ioHandler = (req: Request) => {
  if ((global as any).io) {
    console.log('Socket.io already running')
    return NextResponse.json({ success: true, status: 'already-running' })
  }

  console.log('Initializing Socket.io server...')

  const io = new Server({
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join room for trip tracking
    socket.on('join-trip', (tripId: string) => {
      socket.join(`trip-${tripId}`)
      console.log(`Socket ${socket.id} joined trip-${tripId}`)
    })

    // Leave trip room
    socket.on('leave-trip', (tripId: string) => {
      socket.leave(`trip-${tripId}`)
      console.log(`Socket ${socket.id} left trip-${tripId}`)
    })

    // Driver location update
    socket.on('driver-location', (data: {
      tripId: string
      driverId: string
      latitude: number
      longitude: number
      accuracy?: number
      speed?: number
    }) => {
      // Broadcast to all clients in the trip room
      io.to(`trip-${data.tripId}`).emit('location-update', {
        driverId: data.driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        timestamp: new Date().toISOString(),
      })
    })

    // Driver status update
    socket.on('driver-status', (data: {
      driverId: string
      status: string
      tripId?: string
    }) => {
      if (data.tripId) {
        io.to(`trip-${data.tripId}`).emit('driver-status-update', {
          driverId: data.driverId,
          status: data.status,
        })
      }
    })

    // Chat message
    socket.on('send-message', (data: {
      tripId: string
      senderId: string
      receiverId: string
      content: string
    }) => {
      io.to(`trip-${data.tripId}`).emit('new-message', {
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        timestamp: new Date().toISOString(),
      })
    })

    // Trip request (for on-demand)
    socket.on('trip-request', (data: {
      requestId: string
      tripId: string
      passengerId: string
      pickup: { lat: number; lng: number; name: string }
      dropoff: { lat: number; lng: number; name: string }
      price: number
    }) => {
      // Broadcast to all online drivers in the area
      io.emit('new-trip-request', data)
    })

    // Driver accepts trip
    socket.on('accept-trip', (data: {
      requestId: string
      driverId: string
      tripId: string
    }) => {
      io.emit('trip-accepted', data)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  ;(global as any).io = io

  return NextResponse.json({ success: true, status: 'initialized' })
}

export const GET = ioHandler
export const POST = ioHandler
