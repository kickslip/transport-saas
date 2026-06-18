'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createTripSchema = z.object({
  tenantId: z.string(),
  driverId: z.string(),
  tripType: z.enum(['ON_DEMAND', 'SCHEDULED']),
  vehicleId: z.string().optional(),
  tripScheduleId: z.string().optional(),
  startLocationName: z.string(),
  startLocationLat: z.number(),
  startLocationLng: z.number(),
  endLocationName: z.string(),
  endLocationLat: z.number(),
  endLocationLng: z.number(),
  basePrice: z.number().min(0),
  platformFee: z.number().default(0),
  scheduledStartTime: z.date(),
  availableSeats: z.number().optional(),
  notes: z.string().optional(),
})

export async function createTrip(data: z.infer<typeof createTripSchema>) {
  try {
    const parsed = createTripSchema.parse(data)

    // Calculate total price
    const totalPrice = parsed.basePrice + parsed.platformFee

    const trip = await prisma.trip.create({
      data: {
        tenantId: parsed.tenantId,
        driverId: parsed.driverId,
        tripType: parsed.tripType,
        vehicleId: parsed.vehicleId,
        tripScheduleId: parsed.tripScheduleId,
        startLocationName: parsed.startLocationName,
        startLocationLat: parsed.startLocationLat,
        startLocationLng: parsed.startLocationLng,
        endLocationName: parsed.endLocationName,
        endLocationLat: parsed.endLocationLat,
        endLocationLng: parsed.endLocationLng,
        basePrice: parsed.basePrice,
        platformFee: parsed.platformFee,
        totalPrice,
        scheduledStartTime: parsed.scheduledStartTime,
        availableSeats: parsed.availableSeats,
        notes: parsed.notes,
        status: 'SCHEDULED',
      },
    })

    revalidatePath('/admin/trips')
    revalidatePath('/driver/trips')
    
    return { success: true, trip }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Create trip error:', error)
    return { success: false, error: 'Failed to create trip' }
  }
}

const updateTripStatusSchema = z.object({
  tripId: z.string(),
  status: z.enum([
    'SCHEDULED',
    'DRIVER_ASSIGNED',
    'DRIVER_EN_ROUTE',
    'DRIVER_ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ]),
  cancellationReason: z.string().optional(),
})

export async function updateTripStatus(data: z.infer<typeof updateTripStatusSchema>) {
  try {
    const parsed = updateTripStatusSchema.parse(data)

    const updateData: any = { status: parsed.status }
    
    if (parsed.status === 'IN_PROGRESS') {
      updateData.actualStartTime = new Date()
    } else if (parsed.status === 'COMPLETED') {
      updateData.actualEndTime = new Date()
    } else if (parsed.cancellationReason) {
      updateData.cancellationReason = parsed.cancellationReason
    }

    const trip = await prisma.trip.update({
      where: { id: parsed.tripId },
      data: updateData,
    })

    revalidatePath('/admin/trips')
    revalidatePath('/driver/trips')
    revalidatePath('/passenger/trips')
    
    return { success: true, trip }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Update trip status error:', error)
    return { success: false, error: 'Failed to update trip status' }
  }
}

export async function getTripsByTenant(tenantId: string, filters?: { status?: string; tripType?: string }) {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.tripType && { tripType: filters.tripType as any }),
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
        vehicle: { select: { id: true, make: true, model: true, registrationNumber: true } },
        bookings: { select: { id: true, status: true, passenger: { select: { firstName: true, lastName: true } } } },
        _count: { select: { bookings: true } },
      },
      orderBy: { scheduledStartTime: 'desc' },
    })

    return { success: true, trips }
  } catch (error) {
    console.error('Get trips error:', error)
    return { success: false, error: 'Failed to fetch trips' }
  }
}
