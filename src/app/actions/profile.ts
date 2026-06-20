'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: {
  firstName: string
  lastName: string
  phoneNumber: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
      },
    })
    revalidatePath('/passenger/profile')
    revalidatePath('/driver/profile')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update profile' }
  }
}
