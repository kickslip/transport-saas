'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { auditLog } from '@/lib/audit'

export async function submitReview(data: {
  bookingId: string
  driverId: string
  rating: number
  comment?: string
  punctuality?: number
  cleanliness?: number
  drivingSkill?: number
  communication?: number
}) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  // Verify booking belongs to this passenger and is completed
  const booking = await prisma.booking.findFirst({
    where: {
      id: data.bookingId,
      passengerId: session.user.id,
      status: 'COMPLETED',
    },
  })
  if (!booking) return { success: false, error: 'Booking not found or not completed' }

  // Check no existing review
  const existing = await prisma.review.findUnique({ where: { bookingId: data.bookingId } })
  if (existing) return { success: false, error: 'Already reviewed' }

  try {
    await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        reviewerId: session.user.id,
        driverId: data.driverId,
        rating: data.rating,
        comment: data.comment ?? null,
        punctuality: data.punctuality ?? null,
        cleanliness: data.cleanliness ?? null,
        drivingSkill: data.drivingSkill ?? null,
        communication: data.communication ?? null,
      },
    })
    await auditLog({ action: 'REVIEW_SUBMITTED', userId: session.user.id, entityId: data.bookingId, entityType: 'Booking' })
    revalidatePath('/passenger/trips')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to submit review' }
  }
}

export async function getDriverReviews(driverId: string) {
  return prisma.review.findMany({
    where: { driverId, isVisible: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      rating: true,
      comment: true,
      punctuality: true,
      cleanliness: true,
      drivingSkill: true,
      communication: true,
      createdAt: true,
      reviewer: { select: { firstName: true, lastName: true } },
    },
  })
}
