'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getTenantBookingFeePercent } from './tenantFees'

export async function getUpcomingTrips() {
  const session = await auth()
  if (!session?.user?.id) return []
  try {
    return await prisma.booking.findMany({
      where: {
        passengerId: session.user.id,
        status: { in: ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'] },
      },
      include: { trip: { include: { driver: true, vehicle: true } } },
      orderBy: { createdAt: 'desc' },
    })
  } catch { return [] }
}

export async function getPastTrips() {
  const session = await auth()
  if (!session?.user?.id) return []
  try {
    return await prisma.booking.findMany({
      where: {
        passengerId: session.user.id,
        status: { in: ['COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'NO_SHOW'] },
      },
      include: { trip: { include: { driver: true, vehicle: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  } catch { return [] }
}

export async function getAvailableSchedules(opts?: {
  tenantId?: string
  search?: string
  day?: number
}) {
  try {
    const where: any = {
      isActive: true,
      status: { in: ['ACTIVE', 'PENDING'] },
    }
    if (opts?.tenantId) where.tenantId = opts.tenantId
    if (opts?.search) {
      where.OR = [
        { startLocationName: { contains: opts.search, mode: 'insensitive' } },
        { endLocationName: { contains: opts.search, mode: 'insensitive' } },
        { name: { contains: opts.search, mode: 'insensitive' } },
      ]
    }
    if (opts?.day) {
      where.daysOfWeek = { has: opts.day }
    }
    return await prisma.tripSchedule.findMany({
      where,
      include: {
        tenant: { select: { name: true } },
        driver: { select: { firstName: true, lastName: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { trips: true } },
      },
      orderBy: { startTime: 'asc' },
    })
  } catch { return [] }
}

export async function bookScheduledTrip(scheduleId: string, seatsBooked = 1) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    const schedule = await prisma.tripSchedule.findUnique({
      where: { id: scheduleId },
    })
    if (!schedule) return { success: false, error: 'Schedule not found' }
    if (!schedule.driverId) return { success: false, error: 'No driver assigned to this route yet' }

    const bookingFeePercent = await getTenantBookingFeePercent(schedule.tenantId)
    const platformFee = Math.round(schedule.basePrice * (bookingFeePercent / 100))

    // Find or create today's trip for this schedule
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let trip = await prisma.trip.findFirst({
      where: {
        tripScheduleId: scheduleId,
        scheduledStartTime: { gte: today, lt: tomorrow },
      },
    })

    if (!trip) {
      const [hours, minutes] = schedule.startTime.split(':').map(Number)
      const scheduledStart = new Date()
      scheduledStart.setHours(hours, minutes, 0, 0)

      trip = await prisma.trip.create({
        data: {
          tenantId: schedule.tenantId,
          tripType: 'SCHEDULED',
          driverId: schedule.driverId,
          tripScheduleId: scheduleId,
          startLocationName: schedule.startLocationName,
          startLocationLat: schedule.startLocationLat,
          startLocationLng: schedule.startLocationLng,
          endLocationName: schedule.endLocationName,
          endLocationLat: schedule.endLocationLat,
          endLocationLng: schedule.endLocationLng,
          basePrice: schedule.basePrice,
          platformFee,
          totalPrice: schedule.basePrice + platformFee,
          scheduledStartTime: scheduledStart,
          status: 'SCHEDULED',
        },
      })
    }

    const booking = await prisma.booking.create({
      data: {
        tenantId: schedule.tenantId,
        passengerId: session.user.id,
        tripId: trip.id,
        seatsBooked,
        basePrice: schedule.basePrice,
        platformFee,
        totalPrice: schedule.basePrice + platformFee,
        status: 'CONFIRMED',
      },
    })

    revalidatePath('/passenger/trips')
    revalidatePath('/passenger')
    return { success: true, bookingId: booking.id }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'Failed to create booking' }
  }
}

export async function cancelBooking(bookingId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, passengerId: session.user.id },
    })
    if (!booking) return { success: false, error: 'Booking not found' }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED_BY_PASSENGER' },
    })

    // If this was the only active booking on the trip, cancel the trip too
    const remaining = await prisma.booking.count({
      where: { tripId: booking.tripId, status: { notIn: ['COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'NO_SHOW'] } },
    })
    if (remaining === 0) {
      await prisma.trip.update({
        where: { id: booking.tripId },
        data: { status: 'CANCELLED' },
      })
    }

    revalidatePath('/passenger/trips')
    revalidatePath('/passenger')
    revalidatePath('/driver/trips')
    revalidatePath('/admin/trips')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to cancel booking' }
  }
}

export async function getPassengerStats() {
  const session = await auth()
  if (!session?.user?.id) return { upcoming: 0, total: 0, subscriptions: 0 }
  try {
    const [upcoming, total] = await Promise.all([
      prisma.booking.count({
        where: {
          passengerId: session.user.id,
          status: { in: ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS'] },
        },
      }),
      prisma.booking.count({ where: { passengerId: session.user.id } }),
    ])
    return { upcoming, total, subscriptions: 0 }
  } catch { return { upcoming: 0, total: 0, subscriptions: 0 } }
}
