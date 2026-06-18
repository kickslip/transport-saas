'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['PASSENGER', 'DRIVER', 'ADMIN']),
  tenantId: z.string().optional(),
})

export async function registerUser(data: z.infer<typeof registerSchema>) {
  try {
    const parsed = registerSchema.parse(data)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    })

    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(parsed.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        phoneNumber: parsed.phoneNumber,
        passwordHash,
        role: parsed.role,
        tenantId: parsed.tenantId,
        driverStatus: parsed.role === 'DRIVER' ? 'OFFLINE' : undefined,
      },
    })

    return { success: true, userId: user.id }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    console.error('Registration error:', error)
    return { success: false, error: 'Failed to create account' }
  }
}

export async function createTenant(data: {
  name: string
  slug: string
  contactEmail: string
  contactPhone?: string
  address?: string
}) {
  try {
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
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

    return { success: true, tenant }
  } catch (error) {
    console.error('Tenant creation error:', error)
    return { success: false, error: 'Failed to create tenant' }
  }
}
