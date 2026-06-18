'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createPaymentSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  tripId: z.string().optional(),
  bookingId: z.string().optional(),
  paymentPlanId: z.string().optional(),
  amount: z.number().min(0), // in cents
  platformFee: z.number().default(0),
  method: z.enum(['CASH', 'EFT', 'CARD', 'WALLET', 'FREE']),
  proofOfPaymentUrl: z.string().optional(),
  reference: z.string().optional(),
})

export async function createPayment(data: z.infer<typeof createPaymentSchema>) {
  try {
    const parsed = createPaymentSchema.parse(data)

    const payment = await prisma.payment.create({
      data: {
        tenantId: parsed.tenantId,
        userId: parsed.userId,
        tripId: parsed.tripId,
        bookingId: parsed.bookingId,
        paymentPlanId: parsed.paymentPlanId,
        amount: parsed.amount,
        platformFee: parsed.platformFee,
        method: parsed.method,
        status: parsed.method === 'EFT' ? 'VERIFYING' : 'PENDING',
        proofOfPaymentUrl: parsed.proofOfPaymentUrl,
        reference: parsed.reference || `PAY-${Date.now()}`,
      },
    })

    revalidatePath('/admin/payments')
    revalidatePath('/passenger/wallet')
    
    return { success: true, payment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Create payment error:', error)
    return { success: false, error: 'Failed to create payment' }
  }
}

const verifyPaymentSchema = z.object({
  paymentId: z.string(),
  verifiedBy: z.string(), // admin user ID
  status: z.enum(['COMPLETED', 'FAILED']),
  notes: z.string().optional(),
})

export async function verifyPayment(data: z.infer<typeof verifyPaymentSchema>) {
  try {
    const parsed = verifyPaymentSchema.parse(data)

    const payment = await prisma.payment.update({
      where: { id: parsed.paymentId },
      data: {
        status: parsed.status,
        verifiedBy: parsed.verifiedBy,
        verifiedAt: new Date(),
        notes: parsed.notes,
      },
    })

    // If payment is for a booking, update booking status
    if (payment.bookingId && parsed.status === 'COMPLETED') {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      })
    }

    revalidatePath('/admin/payments')
    revalidatePath('/passenger/wallet')
    
    return { success: true, payment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Verify payment error:', error)
    return { success: false, error: 'Failed to verify payment' }
  }
}

const markCashCollectedSchema = z.object({
  paymentId: z.string(),
  driverId: z.string(),
})

export async function markCashCollected(data: z.infer<typeof markCashCollectedSchema>) {
  try {
    const parsed = markCashCollectedSchema.parse(data)

    const payment = await prisma.payment.update({
      where: { id: parsed.paymentId },
      data: {
        status: 'COMPLETED',
        collectedByDriverId: parsed.driverId,
      },
    })

    // Update booking status
    if (payment.bookingId) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      })
    }

    revalidatePath('/driver/earnings')
    revalidatePath('/passenger/trips')
    
    return { success: true, payment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Mark cash collected error:', error)
    return { success: false, error: 'Failed to mark payment' }
  }
}

export async function getPaymentsByTenant(tenantId: string, filters?: { status?: string; method?: string }) {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.method && { method: filters.method as any }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        trip: { select: { startLocationName: true, endLocationName: true } },
        booking: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, payments }
  } catch (error) {
    console.error('Get payments error:', error)
    return { success: false, error: 'Failed to fetch payments' }
  }
}

export async function getPendingVerifications(tenantId: string) {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: 'VERIFYING',
        method: 'EFT',
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        trip: { select: { startLocationName: true, endLocationName: true } },
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, payments }
  } catch (error) {
    console.error('Get pending verifications error:', error)
    return { success: false, error: 'Failed to fetch pending payments' }
  }
}

// Wallet operations
export async function getWalletBalance(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    })

    return { success: true, balance: user?.walletBalance || 0 }
  } catch (error) {
    console.error('Get wallet balance error:', error)
    return { success: false, error: 'Failed to fetch wallet balance' }
  }
}

export async function topUpWallet(userId: string, amount: number, proofOfPaymentUrl: string) {
  try {
    // Create a wallet top-up payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        tenantId: 'system', // Will be updated when verified
        amount,
        method: 'EFT',
        status: 'VERIFYING',
        proofOfPaymentUrl,
        reference: `WALLET-${Date.now()}`,
      },
    })

    return { success: true, payment }
  } catch (error) {
    console.error('Top up wallet error:', error)
    return { success: false, error: 'Failed to process top-up' }
  }
}

export async function deductFromWallet(userId: string, amount: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    })

    if (!user || user.walletBalance < amount) {
      return { success: false, error: 'Insufficient wallet balance' }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: amount } },
    })

    return { success: true }
  } catch (error) {
    console.error('Deduct from wallet error:', error)
    return { success: false, error: 'Failed to process payment' }
  }
}
