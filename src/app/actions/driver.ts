'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { auditLog } from '@/lib/audit'

export async function createSchedule(data: {
  name: string
  description: string
  startLocationName: string
  startLocationLat: number
  startLocationLng: number
  endLocationName: string
  endLocationLat: number
  endLocationLng: number
  basePrice: number
  startTime: string
  daysOfWeek: number[]
  effectiveFrom: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, tenantId: true },
  })

  if (!user?.tenantId) return { success: false, error: 'User must be assigned to a tenant' }

  const isDriver = user.role === 'DRIVER'
  const isPassenger = user.role === 'PASSENGER'
  if (!isDriver && !isPassenger && user.role !== 'ADMIN') {
    return { success: false, error: 'Only drivers, passengers or admins can create schedules' }
  }

  try {
    const schedule = await prisma.tripSchedule.create({
      data: {
        tenantId: user.tenantId,
        driverId: isDriver ? session.user.id : null,
        createdById: isPassenger ? session.user.id : null,
        name: data.name,
        description: data.description || null,
        startLocationName: data.startLocationName,
        startLocationLat: data.startLocationLat,
        startLocationLng: data.startLocationLng,
        endLocationName: data.endLocationName,
        endLocationLat: data.endLocationLat,
        endLocationLng: data.endLocationLng,
        basePrice: data.basePrice,
        startTime: data.startTime,
        daysOfWeek: data.daysOfWeek,
        recurrenceType: 'WEEKLY',
        effectiveFrom: new Date(data.effectiveFrom),
        status: isDriver ? 'ACTIVE' : 'PENDING',
        isActive: true,
      },
    })
    revalidatePath('/driver/schedules')
    revalidatePath('/passenger/book/scheduled')
    return { success: true, scheduleId: schedule.id }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'Failed to create schedule' }
  }
}

export async function claimSchedule(scheduleId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, tenantId: true },
  })

  if (user?.role !== 'DRIVER') return { success: false, error: 'Only drivers can claim schedules' }
  if (!user.tenantId) return { success: false, error: 'Driver must be assigned to a tenant' }

  try {
    const schedule = await prisma.tripSchedule.findUnique({
      where: { id: scheduleId },
    })
    if (!schedule) return { success: false, error: 'Schedule not found' }
    if (schedule.driverId) return { success: false, error: 'Route already has a driver' }
    if (schedule.tenantId !== user.tenantId) return { success: false, error: 'Route belongs to another tenant' }

    await prisma.tripSchedule.update({
      where: { id: scheduleId },
      data: {
        driverId: session.user.id,
        status: 'ACTIVE',
      },
    })

    await auditLog({
      action: 'SCHEDULE_CLAIMED',
      userId: session.user.id,
      entityId: scheduleId,
      entityType: 'TripSchedule',
    })

    revalidatePath('/driver/schedules')
    revalidatePath('/passenger/book/scheduled')
    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { success: false, error: e?.message ?? 'Failed to claim schedule' }
  }
}

export async function getDriverStats(driverId: string) {
  try {
    const [totalTrips, completedTrips] = await Promise.all([
      prisma.trip.count({ where: { driverId } }),
      prisma.trip.count({ where: { driverId, status: 'COMPLETED' } }),
    ])

    const earningsAgg = await prisma.payment.aggregate({
      where: { userId: driverId, status: 'COMPLETED' },
      _sum: { amount: true },
    })

    return {
      totalTrips,
      completedTrips,
      totalEarnings: earningsAgg._sum.amount ?? 0,
    }
  } catch {
    return { totalTrips: 0, completedTrips: 0, totalEarnings: 0 }
  }
}

export async function enRouteTrip(tripId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.trip.update({
      where: { id: tripId, driverId: session.user.id },
      data: { status: 'DRIVER_EN_ROUTE' },
    })
    await prisma.booking.updateMany({
      where: { tripId, status: { in: ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED'] } },
      data: { status: 'DRIVER_EN_ROUTE' },
    })
    await auditLog({ action: 'DRIVER_EN_ROUTE', userId: session.user.id, entityId: tripId, entityType: 'Trip' })
    revalidatePath('/driver/trips')
    revalidatePath('/driver')
    revalidatePath('/passenger/trips')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update status' }
  }
}

export async function arriveTrip(tripId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.trip.update({
      where: { id: tripId, driverId: session.user.id },
      data: { status: 'DRIVER_ARRIVED' },
    })
    await prisma.booking.updateMany({
      where: { tripId, status: 'DRIVER_EN_ROUTE' },
      data: { status: 'DRIVER_ARRIVED' },
    })
    await auditLog({ action: 'DRIVER_ARRIVED', userId: session.user.id, entityId: tripId, entityType: 'Trip' })
    revalidatePath('/driver/trips')
    revalidatePath('/driver')
    revalidatePath('/passenger/trips')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update status' }
  }
}

export async function startTrip(tripId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.trip.update({
      where: { id: tripId, driverId: session.user.id },
      data: { status: 'IN_PROGRESS', actualStartTime: new Date() },
    })
    await prisma.booking.updateMany({
      where: { tripId, status: { in: ['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED'] } },
      data: { status: 'IN_PROGRESS' },
    })
    await auditLog({ action: 'TRIP_STARTED', userId: session.user.id, entityId: tripId, entityType: 'Trip' })
    revalidatePath('/driver/trips')
    revalidatePath('/driver')
    revalidatePath('/passenger/trips')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to start trip' }
  }
}

export async function completeTrip(tripId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    const bookings = await prisma.booking.findMany({
      where: { tripId },
      include: { trip: { select: { tenantId: true } } },
    })

    await prisma.trip.update({
      where: { id: tripId, driverId: session.user.id },
      data: { status: 'COMPLETED', actualEndTime: new Date() },
    })
    await prisma.booking.updateMany({
      where: { tripId, status: 'IN_PROGRESS' },
      data: { status: 'COMPLETED' },
    })

    // Auto-deduct wallet for completed bookings that have no payment yet
    for (const booking of bookings) {
      const existingPayment = await prisma.payment.findFirst({
        where: { bookingId: booking.id, status: 'COMPLETED' },
      })
      if (!existingPayment && booking.trip?.tenantId) {
        await prisma.payment.create({
          data: {
            tenantId: booking.trip.tenantId,
            userId: booking.passengerId,
            bookingId: booking.id,
            tripId,
            amount: -booking.totalPrice,
            platformFee: booking.platformFee,
            method: 'WALLET',
            status: 'COMPLETED',
            reference: `WALLET-${booking.id.slice(0, 8).toUpperCase()}-${Date.now()}`,
          },
        })
      }
    }

    await auditLog({ action: 'TRIP_COMPLETED', userId: session.user.id, entityId: tripId, entityType: 'Trip' })
    revalidatePath('/driver/trips')
    revalidatePath('/driver')
    revalidatePath('/passenger/trips')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to complete trip' }
  }
}

export async function markAttendance(bookingId: string, present: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: present ? 'COMPLETED' : 'NO_SHOW' },
    })
    revalidatePath('/driver/schedules')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update attendance' }
  }
}

export async function collectCash(bookingId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: { select: { tenantId: true } }, passenger: { select: { id: true } } },
    })
    if (!booking) return { success: false, error: 'Booking not found' }

    const tenantId = booking.trip?.tenantId
    if (!tenantId) return { success: false, error: 'No tenant' }

    const reference = `CASH-${bookingId.slice(0, 8).toUpperCase()}-${Date.now()}`

    await prisma.payment.create({
      data: {
        tenantId,
        userId: booking.passengerId,
        bookingId,
        tripId: booking.tripId,
        amount: booking.totalPrice,
        platformFee: booking.platformFee,
        method: 'CASH',
        status: 'COMPLETED',
        collectedByDriverId: session.user.id,
        reference,
      },
    })
    revalidatePath('/driver/trips')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Failed to collect cash' }
  }
}

export async function cancelTrip(tripId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.trip.update({
      where: { id: tripId, driverId: session.user.id },
      data: { status: 'CANCELLED' },
    })
    await prisma.booking.updateMany({
      where: { tripId, status: { not: 'COMPLETED' } },
      data: { status: 'CANCELLED_BY_DRIVER' },
    })
    await auditLog({ action: 'BOOKING_CANCELLED', userId: session.user.id, entityId: tripId, entityType: 'Trip' })
    revalidatePath('/driver/trips')
    revalidatePath('/driver')
    revalidatePath('/passenger/trips')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to cancel trip' }
  }
}

export async function toggleDriverStatus(currentStatus: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const newStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { driverStatus: newStatus as any },
    })
    revalidatePath('/driver')
    return { success: true, status: newStatus }
  } catch {
    return { success: false, error: 'Failed to update status' }
  }
}
