'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  saasFeePerVehicle: z.number().min(0).default(800),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
})

export async function createTenant(data: z.infer<typeof createTenantSchema>) {
  try {
    const parsed = createTenantSchema.parse(data)

    // Check if slug already exists
    const existing = await prisma.tenant.findUnique({
      where: { slug: parsed.slug },
    })

    if (existing) {
      return { success: false, error: 'Tenant slug already exists' }
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        contactEmail: parsed.contactEmail,
        contactPhone: parsed.contactPhone,
        address: parsed.address,
        description: parsed.description,
        saasFeePerVehicle: parsed.saasFeePerVehicle,
        bankAccountName: parsed.bankAccountName,
        bankAccountNumber: parsed.bankAccountNumber,
        bankName: parsed.bankName,
      },
    })

    // Create default billing settings
    await prisma.tenantBilling.create({
      data: {
        tenantId: tenant.id,
        billingCycle: 'MONTHLY',
        billingDay: 1,
      },
    })

    revalidatePath('/admin/tenants')
    
    return { success: true, tenant }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Create tenant error:', error)
    return { success: false, error: 'Failed to create tenant' }
  }
}

const updateTenantSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  primaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  saasFeePerVehicle: z.number().min(0).optional(),
})

export async function updateTenant(data: z.infer<typeof updateTenantSchema>) {
  try {
    const parsed = updateTenantSchema.parse(data)
    const { tenantId, ...updateData } = parsed

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    })

    revalidatePath('/admin/tenants')
    revalidatePath(`/admin/tenants/${tenantId}`)
    
    return { success: true, tenant }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Update tenant error:', error)
    return { success: false, error: 'Failed to update tenant' }
  }
}

export async function getTenants(filters?: { isActive?: boolean }) {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            trips: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, tenants }
  } catch (error) {
    console.error('Get tenants error:', error)
    return { success: false, error: 'Failed to fetch tenants' }
  }
}

export async function getTenantById(tenantId: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        vehicles: true,
        _count: {
          select: {
            trips: true,
            bookings: true,
          },
        },
        tenantBilling: true,
      },
    })

    if (!tenant) {
      return { success: false, error: 'Tenant not found' }
    }

    return { success: true, tenant }
  } catch (error) {
    console.error('Get tenant error:', error)
    return { success: false, error: 'Failed to fetch tenant' }
  }
}

export async function getTenantStats(tenantId: string) {
  try {
    const [
      totalTrips,
      completedTrips,
      totalBookings,
      totalRevenue,
      vehicleCount,
      driverCount,
      passengerCount,
    ] = await Promise.all([
      prisma.trip.count({ where: { tenantId } }),
      prisma.trip.count({ where: { tenantId, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { tenantId } }),
      prisma.payment.aggregate({
        where: { tenantId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.vehicle.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, role: 'DRIVER' } }),
      prisma.user.count({ where: { tenantId, role: 'PASSENGER' } }),
    ])

    return {
      success: true,
      stats: {
        totalTrips,
        completedTrips,
        totalBookings,
        totalRevenue: totalRevenue._sum.amount || 0,
        vehicleCount,
        driverCount,
        passengerCount,
      },
    }
  } catch (error) {
    console.error('Get tenant stats error:', error)
    return { success: false, error: 'Failed to fetch stats' }
  }
}
