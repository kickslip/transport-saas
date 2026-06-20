/**
 * Tenant-scoped Prisma helpers.
 * Use these in server actions/routes where you want automatic tenant_id filtering
 * without manually adding `where: { tenantId }` everywhere.
 */
import { prisma } from './db'
import { auth } from './auth'

export async function getTenantId(): Promise<string | null> {
  try {
    const session = await auth()
    return (session?.user as any)?.tenantId ?? null
  } catch {
    return null
  }
}

/**
 * Returns a Prisma client extension scoped to the current user's tenant.
 * Falls back to the base client if no tenant is found (e.g., for ADMIN users).
 */
export async function tenantPrisma() {
  const tenantId = await getTenantId()
  if (!tenantId) return prisma

  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }: any) {
          // Only filter models that have a tenantId field
          const tenantedModels = [
            'Trip', 'Booking', 'TripSchedule', 'Payment', 'Message',
            'Review', 'Vehicle', 'Invoice', 'User',
          ]
          if (tenantedModels.includes(model)) {
            args.where = { ...args.where, tenantId }
          }
          return query(args)
        },
      },
    },
  })
}
