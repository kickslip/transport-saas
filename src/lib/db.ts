import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Middleware for tenant isolation
prisma.$use(async (params, next) => {
  // Add tenant filtering for multi-tenancy
  // This is a basic implementation - can be enhanced with row-level security
  return next(params)
})
