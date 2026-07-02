'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { BillingCycle } from '@/generated/prisma/enums'

export async function updateTenantBilling(data: {
  tenantId: string
  bookingFeePercent: number
  saasFeePerVehicle: number
  billingDay?: number
  billingCycle?: BillingCycle
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Not authorized' }
  }

  try {
    await prisma.tenantBilling.upsert({
      where: { tenantId: data.tenantId },
      create: {
        tenantId: data.tenantId,
        bookingFeePercent: data.bookingFeePercent,
        saasFeePerVehicle: data.saasFeePerVehicle,
        billingDay: data.billingDay ?? 1,
        billingCycle: data.billingCycle ?? 'MONTHLY',
      },
      update: {
        bookingFeePercent: data.bookingFeePercent,
        saasFeePerVehicle: data.saasFeePerVehicle,
        billingDay: data.billingDay,
        billingCycle: data.billingCycle,
      },
    })
    revalidatePath('/admin/settings')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update tenant billing' }
  }
}
