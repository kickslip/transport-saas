'use server'

import { prisma } from '@/lib/db'

export async function getTenantBookingFeePercent(tenantId: string): Promise<number> {
  try {
    const billing = await prisma.tenantBilling.findUnique({
      where: { tenantId },
      select: { bookingFeePercent: true },
    })
    return billing?.bookingFeePercent ?? 7
  } catch {
    return 7
  }
}

export async function getTenantSaasFee(tenantId: string): Promise<number> {
  try {
    const billing = await prisma.tenantBilling.findUnique({
      where: { tenantId },
      select: { saasFeePerVehicle: true },
    })
    return billing?.saasFeePerVehicle ?? 20000
  } catch {
    return 20000
  }
}
