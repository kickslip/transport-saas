'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { auditLog } from '@/lib/audit'

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== 'ADMIN') throw new Error('Unauthorized')
  return session!
}

// ── Tenants ──────────────────────────────────────────────
export async function createTenantAdmin(data: {
  name: string
  slug: string
  contactEmail: string
  contactPhone?: string
  address?: string
}) {
  await requireAdmin()
  try {
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        address: data.address || null,
      },
    })
    await prisma.tenantBilling.create({
      data: { tenantId: tenant.id, billingCycle: 'MONTHLY', billingDay: 1 },
    })
    revalidatePath('/admin/tenants')
    return { success: true, tenantId: tenant.id }
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Slug already taken' }
    return { success: false, error: 'Failed to create tenant' }
  }
}

export async function toggleTenantStatus(tenantId: string, isActive: boolean) {
  await requireAdmin()
  await prisma.tenant.update({ where: { id: tenantId }, data: { isActive } })
  revalidatePath('/admin/tenants')
  return { success: true }
}

export async function updateTenantSettings(tenantId: string, data: {
  name: string
  contactEmail: string
  contactPhone?: string
  address?: string
  primaryColor?: string
  logoUrl?: string
}) {
  await requireAdmin()
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: data.name,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || undefined,
      address: data.address || undefined,
      primaryColor: data.primaryColor || undefined,
      logoUrl: data.logoUrl || undefined,
    },
  })
  revalidatePath('/admin/tenants')
  return { success: true }
}

export async function generateMonthlyInvoice(tenantId: string) {
  await requireAdmin()

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { tenantBilling: true },
  })
  if (!tenant) return { success: false, error: 'Tenant not found' }

  const vehicleCount = await prisma.vehicle.count({ where: { tenantId, isActive: true } })
  const saasFeePerVehicle = parseInt(process.env.DEFAULT_TENANT_SAAS_FEE ?? '20000')
  const subtotal = vehicleCount * saasFeePerVehicle
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, tenant.tenantBilling?.billingDay ?? 1)

  const invoiceNumber = `INV-${tenant.slug.toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

  try {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        periodStart,
        periodEnd,
        vehicleCount,
        saasFeePerVehicle,
        subtotal,
        totalAmount: subtotal,
        dueDate,
        status: 'SENT',
        sentAt: new Date(),
      },
    })
    revalidatePath('/admin/invoices')
    return { success: true, invoiceId: invoice.id }
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Invoice already generated for this period' }
    return { success: false, error: 'Failed to generate invoice' }
  }
}

// ── Users ─────────────────────────────────────────────────
export async function toggleUserStatus(userId: string, isActive: boolean) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { isActive } })
  revalidatePath('/admin/users')
  return { success: true }
}

export async function assignUserTenant(userId: string, tenantId: string) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { tenantId } })
  revalidatePath('/admin/users')
  return { success: true }
}

// ── Payments ──────────────────────────────────────────────
export async function verifyPayment(paymentId: string) {
  const session = await requireAdmin()
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'COMPLETED',
      verifiedBy: session.user!.id,
      verifiedAt: new Date(),
    },
  })
  await auditLog({ action: 'PAYMENT_VERIFIED', userId: session.user.id, entityId: paymentId, entityType: 'Payment' })
  revalidatePath('/admin/payments')
  return { success: true }
}

export async function rejectPayment(paymentId: string) {
  const session = await requireAdmin()
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'FAILED' },
  })
  await auditLog({ action: 'PAYMENT_REJECTED', userId: session.user.id, entityId: paymentId, entityType: 'Payment' })
  revalidatePath('/admin/payments')
  return { success: true }
}
