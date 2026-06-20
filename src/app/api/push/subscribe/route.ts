import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const subscription = await req.json()
    const endpoint: string = subscription.endpoint
    const p256dh: string = subscription.keys?.p256dh
    const auth_key: string = subscription.keys?.auth

    if (!endpoint || !p256dh || !auth_key) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth: auth_key, userId: session.user.id },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth: auth_key,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[push/subscribe]', e)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }
}
