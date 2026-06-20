import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { auditLog } from '@/lib/audit'

/**
 * POPIA Right to Access — download all personal data for the authenticated user.
 * GET /api/popia/export
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const [user, bookings, payments, reviews, messages, auditLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phoneNumber: true, role: true, createdAt: true,
      },
    }),
    prisma.booking.findMany({
      where: { passengerId: userId },
      select: {
        id: true, status: true, totalPrice: true, platformFee: true,
        createdAt: true,
        trip: { select: { startLocationName: true, endLocationName: true, scheduledStartTime: true } },
      },
    }),
    prisma.payment.findMany({
      where: { userId },
      select: { id: true, amount: true, method: true, status: true, createdAt: true },
    }),
    prisma.review.findMany({
      where: { reviewerId: userId },
      select: { id: true, rating: true, comment: true, createdAt: true },
    }),
    prisma.message.findMany({
      where: { senderId: userId },
      select: { id: true, content: true, createdAt: true },
      take: 100,
    }),
    prisma.auditLog.findMany({
      where: { userId },
      select: { action: true, entityType: true, entityId: true, createdAt: true, ipAddress: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ])

  await auditLog({
    action: 'DATA_EXPORT',
    userId,
    entityType: 'User',
    entityId: userId,
  })

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: user,
    bookings,
    payments,
    reviewsGiven: reviews,
    messagesSent: messages,
    auditTrail: auditLogs,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="my-data-${userId.slice(0, 8)}.json"`,
    },
  })
}
