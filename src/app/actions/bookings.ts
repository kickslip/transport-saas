'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createBookingSchema = z.object({
  tenantId: z.string(),
  tripId: z.string(),
  passengerId: z.string(),
  pickupLocationName: z.string().optional(),
  pickupLocationLat: z.number().optional(),
  pickupLocationLng: z.number().optional(),
  seatsBooked: z.number().min(1).default(1),
  basePrice: z.number().min(0),
  platformFee: z.number().default(0),
  paymentPlanId: z.string().optional(),
})

export async function createBooking(data: z.infer<typeof createBookingSchema>) {
  try {
    const parsed = createBookingSchema.parse(data)

    // Calculate total price
    const totalPrice = parsed.basePrice + parsed.platformFee

    const booking = await prisma.booking.create({
      data: {
        tenantId: parsed.tenantId,
        tripId: parsed.tripId,
        passengerId: parsed.passengerId,
        pickupLocationName: parsed.pickupLocationName,
        pickupLocationLat: parsed.pickupLocationLat,
        pickupLocationLng: parsed.pickupLocationLng,
        seatsBooked: parsed.seatsBooked,
        basePrice: parsed.basePrice,
        platformFee: parsed.platformFee,
        totalPrice,
        status: 'PENDING',
      },
    })

    revalidatePath('/passenger/bookings')
    revalidatePath('/driver/trips')
    
    return { success: true, booking }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Create booking error:', error)
    return { success: false, error: 'Failed to create booking' }
  }
}

const updateBookingStatusSchema = z.object({
  bookingId: z.string(),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'DRIVER_ASSIGNED',
    'DRIVER_EN_ROUTE',
    'DRIVER_ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
    'NO_SHOW',
    'CANCELLED_BY_PASSENGER',
    'CANCELLED_BY_DRIVER',
  ]),
  attended: z.boolean().optional(),
})

export async function updateBookingStatus(data: z.infer<typeof updateBookingStatusSchema>) {
  try {
    const parsed = updateBookingStatusSchema.parse(data)

    const updateData: any = { status: parsed.status }
    
    if (parsed.attended !== undefined) {
      updateData.attended = parsed.attended
      updateData.attendanceMarkedAt = new Date()
    }

    const booking = await prisma.booking.update({
      where: { id: parsed.bookingId },
      data: updateData,
    })

    revalidatePath('/passenger/bookings')
    revalidatePath('/driver/trips')
    
    return { success: true, booking }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Update booking status error:', error)
    return { success: false, error: 'Failed to update booking' }
  }
}

export async function getBookingsByUser(userId: string, role: 'PASSENGER' | 'DRIVER') {
  try {
    const where = role === 'PASSENGER' 
      ? { passengerId: userId }
      : { trip: { driverId: userId } }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        trip: {
          include: {
            driver: { select: { firstName: true, lastName: true, phoneNumber: true } },
          },
        },
        passenger: { select: { firstName: true, lastName: true, phoneNumber: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, bookings }
  } catch (error) {
    console.error('Get bookings error:', error)
    return { success: false, error: 'Failed to fetch bookings' }
  }
}

export async function getAvailableTripsForBooking(
  tenantId: string,
  filters?: {
    startLocationLat?: number
    startLocationLng?: number
    radius?: number // in km
    date?: Date
  }
) {
  try {
    const where: any = {
      tenantId,
      status: { in: ['SCHEDULED', 'DRIVER_ASSIGNED'] },
      scheduledStartTime: { gte: new Date() },
    }

    if (filters?.date) {
      const startOfDay = new Date(filters.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(filters.date)
      endOfDay.setHours(23, 59, 59, 999)
      where.scheduledStartTime = { gte: startOfDay, lte: endOfDay }
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: {
          select: { id: true, firstName: true, lastName: true, driverRating: true, currentLocationLat: true, currentLocationLng: true },
        },
        vehicle: { select: { make: true, model: true, capacity: true } },
        tripSchedule: true,
        _count: { select: { bookings: { where: { status: { notIn: ['CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'] } } } } },
      },
      orderBy: { scheduledStartTime: 'asc' },
    })

    // Filter by radius if location provided
    let filteredTrips = trips
    if (filters?.startLocationLat && filters?.startLocationLng && filters?.radius) {
      filteredTrips = trips.filter((trip) => {
        const distance = calculateDistance(
          filters.startLocationLat!,
          filters.startLocationLng!,
          trip.startLocationLat,
          trip.startLocationLng
        )
        return distance <= filters.radius!
      })
    }

    return { success: true, trips: filteredTrips }
  } catch (error) {
    console.error('Get available trips error:', error)
    return { success: false, error: 'Failed to fetch trips' }
  }
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(value: number): number {
  return (value * Math.PI) / 180
}
