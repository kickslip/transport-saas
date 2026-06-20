import "dotenv/config"
import { PrismaClient, UserRole, DriverStatus, DriverTier } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Start seeding...')

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Transport Company',
      slug: 'default',
      contactEmail: 'admin@default.com',
      description: 'Default tenant for testing',
      saasFeePerVehicle: 800,
      bankAccountName: 'Default Transport',
      bankAccountNumber: '1234567890',
      bankName: 'Standard Bank',
    },
  })

  console.log(`Created tenant: ${tenant.name}`)

  // Create tenant billing settings
  await prisma.tenantBilling.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      billingCycle: 'MONTHLY',
      billingDay: 1,
    },
  })

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      tenantId: tenant.id,
      isActive: true,
    },
  })

  console.log(`Created admin user: ${admin.email}`)

  // Create driver user
  const driverPassword = await bcrypt.hash('driver123', 10)
  const driver = await prisma.user.upsert({
    where: { email: 'driver@example.com' },
    update: {},
    create: {
      email: 'driver@example.com',
      firstName: 'John',
      lastName: 'Driver',
      phoneNumber: '+27 72 123 4567',
      passwordHash: driverPassword,
      role: UserRole.DRIVER,
      tenantId: tenant.id,
      driverStatus: DriverStatus.ONLINE,
      driverTier: DriverTier.FREE,
      driverLicenseNumber: 'DL123456',
      isActive: true,
    },
  })

  console.log(`Created driver user: ${driver.email}`)

  // Create passenger user
  const passengerPassword = await bcrypt.hash('passenger123', 10)
  const passenger = await prisma.user.upsert({
    where: { email: 'passenger@example.com' },
    update: {},
    create: {
      email: 'passenger@example.com',
      firstName: 'Jane',
      lastName: 'Passenger',
      phoneNumber: '+27 82 987 6543',
      passwordHash: passengerPassword,
      role: UserRole.PASSENGER,
      tenantId: tenant.id,
      isActive: true,
    },
  })

  console.log(`Created passenger user: ${passenger.email}`)

  // Create sample vehicle
  const vehicle = await prisma.vehicle.upsert({
    where: { registrationNumber: 'ABC123GP' },
    update: {},
    create: {
      tenantId: tenant.id,
      registrationNumber: 'ABC123GP',
      make: 'Toyota',
      model: 'Quantum',
      year: 2022,
      color: 'White',
      capacity: 14,
    },
  })

  console.log(`Created vehicle: ${vehicle.registrationNumber}`)

  // Create sample trip schedule (commuter route)
  const schedule = await prisma.tripSchedule.create({
    data: {
      tenantId: tenant.id,
      driverId: driver.id,
      name: 'Morning Commuter - Sandton to CBD',
      description: 'Weekday morning commute from Sandton to Johannesburg CBD',
      startLocationName: 'Sandton City, Sandton',
      startLocationLat: -26.1086,
      startLocationLng: 28.0574,
      endLocationName: 'Johannesburg CBD',
      endLocationLat: -26.2041,
      endLocationLng: 28.0473,
      basePrice: 3500, // R35 in cents
      recurrenceType: 'WEEKDAYS',
      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
      startTime: '07:30',
      effectiveFrom: new Date(),
    },
  })

  console.log(`Created trip schedule: ${schedule.name}`)

  console.log('Seeding completed successfully!')
  console.log('\nTest accounts:')
  console.log('Admin:    admin@example.com / admin123')
  console.log('Driver:   driver@example.com / driver123')
  console.log('Passenger: passenger@example.com / passenger123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
