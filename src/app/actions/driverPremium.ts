'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const PREMIUM_MONTHLY_FEE = 20000 // R200 in cents

export async function upgradeToPremium() {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true, driverTier: true, walletBalance: true },
    })
    if (!user?.tenantId) return { success: false, error: 'No tenant assigned' }
    if (user.driverTier === 'PREMIUM') return { success: false, error: 'Already on Premium tier' }
    if (user.walletBalance < PREMIUM_MONTHLY_FEE) {
      return { success: false, error: 'Insufficient wallet balance. Top up via EFT.' }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { driverTier: 'PREMIUM', walletBalance: { decrement: PREMIUM_MONTHLY_FEE } },
      }),
      prisma.payment.create({
        data: {
          tenantId: user.tenantId,
          userId: session.user.id,
          amount: -PREMIUM_MONTHLY_FEE,
          platformFee: 0,
          method: 'WALLET',
          status: 'COMPLETED',
          reference: `PREMIUM-${session.user.id.slice(0, 8).toUpperCase()}-${Date.now()}`,
          notes: 'Driver premium tier upgrade',
        },
      }),
    ])

    revalidatePath('/driver')
    revalidatePath('/driver/profile')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to upgrade to premium' }
  }
}
