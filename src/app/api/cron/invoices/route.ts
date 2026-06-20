import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Vercel Cron job — runs on the 1st of each month at 06:00 UTC.
 * Automatically generates draft invoices for all active tenants
 * that have autoInvoice enabled.
 *
 * Schedule: configured in vercel.json
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 15)

  const billings = await prisma.tenantBilling.findMany({
    where: { autoInvoice: true },
    include: {
      tenant: {
        include: {
          vehicles: { where: { isActive: true }, select: { id: true } },
        },
      },
    },
  }).catch(() => [])

  const results: { tenantId: string; status: string }[] = []

  for (const billing of billings) {
    const tenant = billing.tenant
    const vehicleCount = tenant.vehicles.length
    if (vehicleCount === 0) continue

    // Avoid duplicates
    const month = periodStart.getMonth() + 1
    const year = periodStart.getFullYear()
    const invoiceNumber = `INV-${tenant.slug.toUpperCase()}-${year}${String(month).padStart(2, '0')}`

    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } }).catch(() => null)
    if (existing) { results.push({ tenantId: tenant.id, status: 'skipped' }); continue }

    const saasFee = Number(process.env.DEFAULT_TENANT_SAAS_FEE ?? 20000)
    const subtotal = vehicleCount * saasFee
    await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        invoiceNumber,
        periodStart,
        periodEnd,
        vehicleCount,
        saasFeePerVehicle: saasFee,
        subtotal,
        totalAmount: subtotal,
        dueDate,
        status: 'DRAFT',
      },
    }).catch(() => null)

    results.push({ tenantId: tenant.id, status: 'created' })
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
