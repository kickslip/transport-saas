'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateDriverDocuments(data: {
  driverLicenseNumber?: string
  driverLicenseExpiry?: string
  driverLicenseImageUrl?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    const updateData: any = {}
    if (data.driverLicenseNumber !== undefined) updateData.driverLicenseNumber = data.driverLicenseNumber || null
    if (data.driverLicenseExpiry !== undefined) {
      updateData.driverLicenseExpiry = data.driverLicenseExpiry ? new Date(data.driverLicenseExpiry) : null
    }
    if (data.driverLicenseImageUrl !== undefined) updateData.driverLicenseImageUrl = data.driverLicenseImageUrl || null

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })
    revalidatePath('/driver/profile')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update documents' }
  }
}
