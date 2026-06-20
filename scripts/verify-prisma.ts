import "dotenv/config"
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  try {
    const tenantCount = await prisma.tenant.count()
    const userCount = await prisma.user.count()
    const vehicleCount = await prisma.vehicle.count()
    console.log(`✅ Connected.`)
    console.log(`   Tenants: ${tenantCount}`)
    console.log(`   Users:   ${userCount}`)
    console.log(`   Vehicles: ${vehicleCount}`)
  } catch (error) {
    console.error('❌ Connection failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
