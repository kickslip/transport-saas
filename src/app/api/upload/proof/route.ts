import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const amountStr = formData.get('amount') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WEBP or PDF.' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Save to public/uploads/proofs/
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'proofs')
    await mkdir(uploadsDir, { recursive: true })

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${session.user.id}-${Date.now()}.${ext}`
    const filePath = path.join(uploadsDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const proofUrl = `/uploads/proofs/${filename}`
    const amountCents = Math.round(parseFloat(amountStr ?? '0') * 100)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    })
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant assigned' }, { status: 400 })
    }

    const reference = `EFT-${session.user.id.slice(0, 6).toUpperCase()}-${Date.now()}`

    const payment = await prisma.payment.create({
      data: {
        tenantId: user.tenantId,
        userId: session.user.id,
        amount: amountCents,
        method: 'EFT',
        status: 'VERIFYING',
        proofOfPaymentUrl: proofUrl,
        reference,
      },
    })

    return NextResponse.json({ success: true, paymentId: payment.id, proofUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
