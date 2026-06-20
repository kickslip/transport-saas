'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function getMessages(tripId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.message.findMany({
    where: { tripId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  })
}

export async function sendMessage(tripId: string, content: string, receiverId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }
  if (!content.trim()) return { success: false, error: 'Empty message' }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  })
  if (!user?.tenantId) return { success: false, error: 'No tenant' }

  try {
    const message = await prisma.message.create({
      data: {
        tenantId: user.tenantId,
        tripId,
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    })
    return { success: true, message }
  } catch {
    return { success: false, error: 'Failed to send message' }
  }
}
