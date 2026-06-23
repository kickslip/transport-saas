import "dotenv/config"
import {
  PrismaClient,
  UserRole,
  DriverStatus,
  DriverTier,
  TripType,
  TripStatus,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000)
let refN = 1
const ref = () => `REF-SEED-${String(refN++).padStart(5, '0')}`

async function main() {
  console.log('🌱 Seeding database...')

  const pw = (p: string) => bcrypt.hash(p, 10)

  // ════════════════════════════════════════════════════════════
  // 1. TENANTS  (3 fleet companies)
  // ════════════════════════════════════════════════════════════
  const tenantRows = [
    { name: 'Joburg Commuter Express', slug: 'jce', contactEmail: 'admin@jce.co.za', contactPhone: '+27 11 000 1111', primaryColor: '#1d4ed8', saasFeePerVehicle: 50000, bankAccountName: 'Joburg Commuter Express', bankAccountNumber: '1001001001', bankName: 'FNB' },
    { name: 'Cape Shuttle Co',         slug: 'csc', contactEmail: 'admin@csc.co.za',  contactPhone: '+27 21 000 2222', primaryColor: '#059669', saasFeePerVehicle: 40000, bankAccountName: 'Cape Shuttle Co',         bankAccountNumber: '2002002002', bankName: 'Nedbank' },
    { name: 'Durban Rapid Transit',    slug: 'drt', contactEmail: 'admin@drt.co.za',  contactPhone: '+27 31 000 3333', primaryColor: '#dc2626', saasFeePerVehicle: 35000, bankAccountName: 'Durban Rapid Transit',    bankAccountNumber: '3003003003', bankName: 'Standard Bank' },
  ]
  const tenants: any[] = []
  for (const td of tenantRows) {
    const t = await prisma.tenant.upsert({ where: { slug: td.slug }, update: {}, create: td })
    await prisma.tenantBilling.upsert({ where: { tenantId: t.id }, update: {}, create: { tenantId: t.id, billingCycle: 'MONTHLY', billingDay: 1, autoInvoice: true } })
    tenants.push(t)
    console.log(`  ✔ Tenant: ${t.name}`)
  }
  const [jce, csc, drt] = tenants

  // ════════════════════════════════════════════════════════════
  // 2. ADMIN USERS
  // ════════════════════════════════════════════════════════════
  const adminPw = await pw('admin123')
  await prisma.user.upsert({ where: { email: 'admin@example.com' }, update: {}, create: { email: 'admin@example.com', firstName: 'Super', lastName: 'Admin', passwordHash: adminPw, role: UserRole.ADMIN, tenantId: jce.id, isActive: true } })
  await prisma.user.upsert({ where: { email: 'admin@jce.co.za' },   update: {}, create: { email: 'admin@jce.co.za',   firstName: 'Lebo',  lastName: 'Mokoena',  passwordHash: adminPw, role: UserRole.ADMIN, tenantId: jce.id, isActive: true } })
  await prisma.user.upsert({ where: { email: 'admin@csc.co.za' },   update: {}, create: { email: 'admin@csc.co.za',   firstName: 'Charl', lastName: 'du Toit',  passwordHash: adminPw, role: UserRole.ADMIN, tenantId: csc.id, isActive: true } })
  await prisma.user.upsert({ where: { email: 'admin@drt.co.za' },   update: {}, create: { email: 'admin@drt.co.za',   firstName: 'Suren', lastName: 'Govender', passwordHash: adminPw, role: UserRole.ADMIN, tenantId: drt.id, isActive: true } })
  console.log('  ✔ Admin users')

  // ════════════════════════════════════════════════════════════
  // 3. COMPANY DRIVERS  (3 per tenant)
  // ════════════════════════════════════════════════════════════
  const driverPw = await pw('driver123')
  const driverRows = [
    // JCE
    { email: 'driver@example.com',  firstName: 'John',     lastName: 'Mokoena',  phone: '+27 72 111 0001', tenantId: jce.id, tier: DriverTier.VERIFIED, rating: 4.8, reviews: 42, wallet: 180000 },
    { email: 'sipho@jce.co.za',     firstName: 'Sipho',    lastName: 'Dlamini',  phone: '+27 72 111 0002', tenantId: jce.id, tier: DriverTier.FREE,     rating: 4.5, reviews: 18, wallet: 95000  },
    { email: 'thabo@jce.co.za',     firstName: 'Thabo',    lastName: 'Nkosi',    phone: '+27 72 111 0003', tenantId: jce.id, tier: DriverTier.PREMIUM,  rating: 4.9, reviews: 97, wallet: 320000 },
    // CSC
    { email: 'driver@csc.co.za',    firstName: 'Pieter',   lastName: 'van Wyk',  phone: '+27 82 222 0001', tenantId: csc.id, tier: DriverTier.VERIFIED, rating: 4.7, reviews: 55, wallet: 210000 },
    { email: 'aneesa@csc.co.za',    firstName: 'Aneesa',   lastName: 'Petersen', phone: '+27 82 222 0002', tenantId: csc.id, tier: DriverTier.FREE,     rating: 4.3, reviews: 22, wallet: 70000  },
    { email: 'graeme@csc.co.za',    firstName: 'Graeme',   lastName: 'Smith',    phone: '+27 82 222 0003', tenantId: csc.id, tier: DriverTier.PREMIUM,  rating: 4.6, reviews: 63, wallet: 255000 },
    // DRT
    { email: 'driver@drt.co.za',    firstName: 'Lungelo',  lastName: 'Zulu',     phone: '+27 31 333 0001', tenantId: drt.id, tier: DriverTier.VERIFIED, rating: 4.4, reviews: 31, wallet: 130000 },
    { email: 'priya@drt.co.za',     firstName: 'Priya',    lastName: 'Naidoo',   phone: '+27 31 333 0002', tenantId: drt.id, tier: DriverTier.FREE,     rating: 4.2, reviews: 14, wallet: 55000  },
    { email: 'blessing@drt.co.za',  firstName: 'Blessing', lastName: 'Khumalo',  phone: '+27 31 333 0003', tenantId: drt.id, tier: DriverTier.PREMIUM,  rating: 4.7, reviews: 78, wallet: 290000 },
  ]
  const companyDrivers: any[] = []
  for (const d of driverRows) {
    const u = await prisma.user.upsert({
      where: { email: d.email }, update: {},
      create: { email: d.email, firstName: d.firstName, lastName: d.lastName, phoneNumber: d.phone, passwordHash: driverPw, role: UserRole.DRIVER, tenantId: d.tenantId, driverStatus: DriverStatus.ONLINE, driverTier: d.tier, driverRating: d.rating, driverReviewCount: d.reviews, driverLicenseNumber: `DL${rand(100000, 999999)}`, isActive: true, walletBalance: d.wallet },
    })
    companyDrivers.push(u)
  }
  console.log(`  ✔ ${companyDrivers.length} company drivers`)

  // ════════════════════════════════════════════════════════════
  // 4. INDEPENDENT DRIVERS  (no tenant — on-demand only)
  // ════════════════════════════════════════════════════════════
  const indieRows = [
    { email: 'indie1@driver.co.za', firstName: 'Kabelo',   lastName: 'Sithole',  phone: '+27 60 400 0001', tier: DriverTier.FREE,     rating: 4.1, reviews: 9,  wallet: 42000  },
    { email: 'indie2@driver.co.za', firstName: 'Reza',     lastName: 'Adams',    phone: '+27 60 400 0002', tier: DriverTier.VERIFIED, rating: 4.6, reviews: 37, wallet: 115000 },
    { email: 'indie3@driver.co.za', firstName: 'Yolanda',  lastName: 'Ferreira', phone: '+27 60 400 0003', tier: DriverTier.FREE,     rating: 3.9, reviews: 5,  wallet: 18000  },
    { email: 'indie4@driver.co.za', firstName: 'Mthokozisi',lastName: 'Ndlovu',  phone: '+27 60 400 0004', tier: DriverTier.PREMIUM,  rating: 4.8, reviews: 61, wallet: 245000 },
  ]
  const indieDrivers: any[] = []
  for (const d of indieRows) {
    const u = await prisma.user.upsert({
      where: { email: d.email }, update: {},
      create: { email: d.email, firstName: d.firstName, lastName: d.lastName, phoneNumber: d.phone, passwordHash: driverPw, role: UserRole.DRIVER, tenantId: null, driverStatus: DriverStatus.ONLINE, driverTier: d.tier, driverRating: d.rating, driverReviewCount: d.reviews, driverLicenseNumber: `DL${rand(100000, 999999)}`, isActive: true, walletBalance: d.wallet },
    })
    indieDrivers.push(u)
  }
  console.log(`  ✔ ${indieDrivers.length} independent drivers (no tenant)`)

  // ════════════════════════════════════════════════════════════
  // 5. PASSENGERS
  // ════════════════════════════════════════════════════════════
  const passPw = await pw('passenger123')
  const passRows = [
    { email: 'passenger@example.com', firstName: 'Jane',    lastName: 'Sithole',  phone: '+27 83 100 0001', tenantId: jce.id, wallet: 15000 },
    { email: 'thandi@jce.co.za',      firstName: 'Thandi',  lastName: 'Mthembu', phone: '+27 83 100 0002', tenantId: jce.id, wallet: 50000 },
    { email: 'marco@csc.co.za',       firstName: 'Marco',   lastName: 'Fourie',   phone: '+27 83 100 0003', tenantId: csc.id, wallet: 35000 },
    { email: 'fatima@csc.co.za',      firstName: 'Fatima',  lastName: 'Adams',    phone: '+27 83 100 0004', tenantId: csc.id, wallet: 20000 },
    { email: 'raj@drt.co.za',         firstName: 'Raj',     lastName: 'Pillay',   phone: '+27 83 100 0005', tenantId: drt.id, wallet: 80000 },
    { email: 'nomsa@drt.co.za',       firstName: 'Nomsa',   lastName: 'Zwane',    phone: '+27 83 100 0006', tenantId: drt.id, wallet: 10000 },
    // Passengers who use independent drivers (no fixed tenant)
    { email: 'indie.pass1@gmail.com', firstName: 'Derek',   lastName: 'Joubert',  phone: '+27 79 500 0001', tenantId: null,   wallet: 0 },
    { email: 'indie.pass2@gmail.com', firstName: 'Zanele',  lastName: 'Motha',    phone: '+27 79 500 0002', tenantId: null,   wallet: 5000 },
  ]
  const passengers: any[] = []
  for (const p of passRows) {
    const u = await prisma.user.upsert({
      where: { email: p.email }, update: {},
      create: { email: p.email, firstName: p.firstName, lastName: p.lastName, phoneNumber: p.phone, passwordHash: passPw, role: UserRole.PASSENGER, tenantId: p.tenantId, isActive: true, walletBalance: p.wallet },
    })
    passengers.push(u)
  }
  console.log(`  ✔ ${passengers.length} passengers`)

  // ════════════════════════════════════════════════════════════
  // 6. VEHICLES  (3 per tenant + 2 for indie drivers)
  // ════════════════════════════════════════════════════════════
  const vehicleRows = [
    { reg: 'JCE001GP', make: 'Toyota',  model: 'Quantum', year: 2022, color: 'White',  capacity: 14, tenantId: jce.id },
    { reg: 'JCE002GP', make: 'Toyota',  model: 'Quantum', year: 2021, color: 'Silver', capacity: 14, tenantId: jce.id },
    { reg: 'JCE003GP', make: 'VW',      model: 'Crafter', year: 2023, color: 'White',  capacity: 16, tenantId: jce.id },
    { reg: 'CSC001WP', make: 'Hyundai', model: 'H-1',     year: 2022, color: 'Blue',   capacity: 12, tenantId: csc.id },
    { reg: 'CSC002WP', make: 'Toyota',  model: 'HiAce',   year: 2020, color: 'White',  capacity: 14, tenantId: csc.id },
    { reg: 'CSC003WP', make: 'Ford',    model: 'Transit', year: 2023, color: 'Grey',   capacity: 15, tenantId: csc.id },
    { reg: 'DRT001KZ', make: 'Toyota',  model: 'Quantum', year: 2021, color: 'Yellow', capacity: 14, tenantId: drt.id },
    { reg: 'DRT002KZ', make: 'Nissan',  model: 'NV350',   year: 2022, color: 'White',  capacity: 15, tenantId: drt.id },
    { reg: 'DRT003KZ', make: 'VW',      model: 'Crafter', year: 2020, color: 'Green',  capacity: 16, tenantId: drt.id },
    // Independent driver vehicles (assigned to JCE for FK constraint — drivers are tenantless)
    { reg: 'IND001GP', make: 'Toyota',  model: 'Corolla', year: 2020, color: 'Black',  capacity: 4,  tenantId: jce.id },
    { reg: 'IND002GP', make: 'Honda',   model: 'Ballade', year: 2019, color: 'Silver', capacity: 4,  tenantId: jce.id },
  ]
  const vehicles: any[] = []
  for (const v of vehicleRows) {
    const veh = await prisma.vehicle.upsert({
      where: { registrationNumber: v.reg }, update: {},
      create: { registrationNumber: v.reg, make: v.make, model: v.model, year: v.year, color: v.color, capacity: v.capacity, tenantId: v.tenantId as string, vehicleType: v.capacity > 6 ? 'MINIBUS' : 'SEDAN', isActive: true },
    })
    vehicles.push(veh)
  }
  console.log(`  ✔ ${vehicles.length} vehicles`)

  // ════════════════════════════════════════════════════════════
  // 7. TRIP SCHEDULES
  // ════════════════════════════════════════════════════════════
  const scheduleRows = [
    { tenantId: jce.id, driverId: companyDrivers[0].id, name: 'Sandton → CBD Morning',      startLocationName: 'Sandton City',      startLocationLat: -26.1086, startLocationLng: 28.0574, endLocationName: 'Johannesburg CBD',  endLocationLat: -26.2041, endLocationLng: 28.0473, basePrice: 3500, startTime: '07:00' },
    { tenantId: jce.id, driverId: companyDrivers[1].id, name: 'Soweto → Sandton Express',    startLocationName: 'Soweto Taxi Rank',  startLocationLat: -26.2680, startLocationLng: 27.8590, endLocationName: 'Sandton City',      endLocationLat: -26.1086, endLocationLng: 28.0574, basePrice: 4500, startTime: '06:30' },
    { tenantId: jce.id, driverId: companyDrivers[2].id, name: 'Midrand → Park Station',      startLocationName: 'Midrand Gautrain',  startLocationLat: -25.9929, startLocationLng: 28.1275, endLocationName: 'Park Station JHB',  endLocationLat: -26.1968, endLocationLng: 28.0438, basePrice: 5000, startTime: '07:15' },
    { tenantId: csc.id, driverId: companyDrivers[3].id, name: 'Bellville → Cape Town CBD',   startLocationName: 'Bellville Station', startLocationLat: -33.9006, startLocationLng: 18.6290, endLocationName: 'Cape Town CBD',     endLocationLat: -33.9249, endLocationLng: 18.4241, basePrice: 4000, startTime: '07:00' },
    { tenantId: csc.id, driverId: companyDrivers[4].id, name: 'Somerset West → Century City',startLocationName: 'Somerset West Mall',startLocationLat: -34.0715, startLocationLng: 18.8446, endLocationName: 'Century City',      endLocationLat: -33.8925, endLocationLng: 18.5135, basePrice: 5500, startTime: '06:45' },
    { tenantId: drt.id, driverId: companyDrivers[6].id, name: 'Pinetown → Durban CBD',       startLocationName: 'Pinetown Taxi Rank',startLocationLat: -29.8179, startLocationLng: 30.8574, endLocationName: 'Durban CBD',        endLocationLat: -29.8587, endLocationLng: 31.0218, basePrice: 3000, startTime: '07:30' },
    { tenantId: drt.id, driverId: companyDrivers[7].id, name: 'Umlazi → Berea',              startLocationName: 'Umlazi Mega City',  startLocationLat: -29.9767, startLocationLng: 30.8966, endLocationName: 'Berea Centre',      endLocationLat: -29.8625, endLocationLng: 31.0105, basePrice: 2800, startTime: '07:00' },
  ]
  const schedules: any[] = []
  for (const s of scheduleRows) {
    const sch = await prisma.tripSchedule.create({
      data: { ...s, recurrenceType: 'WEEKDAYS', daysOfWeek: [1,2,3,4,5], effectiveFrom: daysAgo(90), isActive: true },
    })
    schedules.push(sch)
  }
  console.log(`  ✔ ${schedules.length} schedules`)

  // ════════════════════════════════════════════════════════════
  // 8. COMPLETED TRIPS + BOOKINGS + PAYMENTS + REVIEWS
  // ════════════════════════════════════════════════════════════

  // Helper: create a full completed trip + booking + payment + optional review
  async function makeTrip(opts: {
    tenantId: string | null
    driverId: string
    vehicleId: string
    passengerId: string
    scheduleId?: string
    tripType: TripType
    startName: string; startLat: number; startLng: number
    endName: string;   endLat: number;   endLng: number
    basePrice: number
    platformFee: number
    method: PaymentMethod
    daysBack: number
    rating?: number
  }) {
    const totalPrice = opts.basePrice + opts.platformFee
    const tripStart = daysAgo(opts.daysBack)
    tripStart.setHours(rand(6, 9), rand(0, 59))
    const tripEnd = new Date(tripStart.getTime() + rand(25, 70) * 60_000)

    const trip = await prisma.trip.create({ data: {
      tenantId: (opts.tenantId ?? jce.id) as string,
      driverId: opts.driverId,
      vehicleId: opts.vehicleId,
      tripScheduleId: opts.scheduleId ?? null,
      tripType: opts.tripType,
      startLocationName: opts.startName, startLocationLat: opts.startLat, startLocationLng: opts.startLng,
      endLocationName: opts.endName,     endLocationLat: opts.endLat,     endLocationLng: opts.endLng,
      basePrice: opts.basePrice,
      platformFee: opts.platformFee,
      totalPrice,
      scheduledStartTime: tripStart,
      actualStartTime: tripStart,
      actualEndTime: tripEnd,
      status: TripStatus.COMPLETED,
      availableSeats: rand(4, 14),
    }})

    const booking = await prisma.booking.create({ data: {
      tenantId: (opts.tenantId ?? jce.id) as string,
      tripId: trip.id,
      passengerId: opts.passengerId,
      driverId: opts.driverId,
      seatsBooked: 1,
      basePrice: opts.basePrice,
      platformFee: opts.platformFee,
      totalPrice,
      status: BookingStatus.COMPLETED,
      attended: true,
      attendanceMarkedAt: tripEnd,
    }})

    await prisma.payment.create({ data: {
      tenantId: (opts.tenantId ?? jce.id) as string,
      userId: opts.passengerId,
      tripId: trip.id,
      bookingId: booking.id,
      amount: totalPrice,
      platformFee: opts.platformFee,
      method: opts.method,
      status: PaymentStatus.COMPLETED,
      reference: ref(),
      collectedByDriverId: opts.method === PaymentMethod.CASH ? opts.driverId : null,
      verifiedAt: opts.method === PaymentMethod.EFT ? tripEnd : null,
    }})

    if (opts.rating) {
      const r = opts.rating
      await prisma.review.create({ data: {
        bookingId: booking.id,
        reviewerId: opts.passengerId,
        driverId: opts.driverId,
        rating: r,
        punctuality: Math.min(5, r + (Math.random() > 0.5 ? 0 : -1)),
        cleanliness: Math.min(5, r + (Math.random() > 0.5 ? 0 : -1)),
        drivingSkill: r,
        communication: Math.min(5, r + (Math.random() > 0.5 ? 1 : 0)),
        comment: r >= 5 ? 'Excellent driver, very punctual!' : r >= 4 ? 'Good trip overall.' : 'Decent ride, could be better.',
        isVisible: true,
      }}).catch(() => null) // ignore duplicate booking review
    }

    return trip
  }

  // ── Company driver trips (scheduled) ──────────────────────────────────────
  const companyTrips = [
    // JCE
    { driverId: companyDrivers[0].id, vehicleId: vehicles[0].id, passengerId: passengers[0].id, scheduleId: schedules[0].id, sName: 'Sandton City', sLat: -26.1086, sLng: 28.0574, eName: 'Johannesburg CBD', eLat: -26.2041, eLng: 28.0473, price: 3500, fee: 500, method: PaymentMethod.CASH,   daysBack: 30, rating: 5, tenantId: jce.id },
    { driverId: companyDrivers[0].id, vehicleId: vehicles[0].id, passengerId: passengers[1].id, scheduleId: schedules[0].id, sName: 'Sandton City', sLat: -26.1086, sLng: 28.0574, eName: 'Johannesburg CBD', eLat: -26.2041, eLng: 28.0473, price: 3500, fee: 500, method: PaymentMethod.EFT,    daysBack: 23, rating: 4, tenantId: jce.id },
    { driverId: companyDrivers[0].id, vehicleId: vehicles[0].id, passengerId: passengers[0].id, scheduleId: schedules[0].id, sName: 'Sandton City', sLat: -26.1086, sLng: 28.0574, eName: 'Johannesburg CBD', eLat: -26.2041, eLng: 28.0473, price: 3500, fee: 500, method: PaymentMethod.CASH,   daysBack: 16, rating: 5, tenantId: jce.id },
    { driverId: companyDrivers[1].id, vehicleId: vehicles[1].id, passengerId: passengers[1].id, scheduleId: schedules[1].id, sName: 'Soweto Taxi Rank', sLat: -26.2680, sLng: 27.8590, eName: 'Sandton City', eLat: -26.1086, eLng: 28.0574, price: 4500, fee: 500, method: PaymentMethod.EFT,    daysBack: 28, rating: 4, tenantId: jce.id },
    { driverId: companyDrivers[1].id, vehicleId: vehicles[1].id, passengerId: passengers[0].id, scheduleId: schedules[1].id, sName: 'Soweto Taxi Rank', sLat: -26.2680, sLng: 27.8590, eName: 'Sandton City', eLat: -26.1086, eLng: 28.0574, price: 4500, fee: 500, method: PaymentMethod.WALLET, daysBack: 14, rating: 5, tenantId: jce.id },
    { driverId: companyDrivers[2].id, vehicleId: vehicles[2].id, passengerId: passengers[1].id, scheduleId: schedules[2].id, sName: 'Midrand Gautrain', sLat: -25.9929, sLng: 28.1275, eName: 'Park Station JHB', eLat: -26.1968, eLng: 28.0438, price: 5000, fee: 500, method: PaymentMethod.CASH,   daysBack: 10, rating: 4, tenantId: jce.id },
    { driverId: companyDrivers[2].id, vehicleId: vehicles[2].id, passengerId: passengers[0].id, scheduleId: schedules[2].id, sName: 'Midrand Gautrain', sLat: -25.9929, sLng: 28.1275, eName: 'Park Station JHB', eLat: -26.1968, eLng: 28.0438, price: 5000, fee: 500, method: PaymentMethod.EFT,    daysBack:  4, rating: 5, tenantId: jce.id },
    // CSC
    { driverId: companyDrivers[3].id, vehicleId: vehicles[3].id, passengerId: passengers[2].id, scheduleId: schedules[3].id, sName: 'Bellville Station', sLat: -33.9006, sLng: 18.6290, eName: 'Cape Town CBD', eLat: -33.9249, eLng: 18.4241, price: 4000, fee: 500, method: PaymentMethod.CASH,   daysBack: 22, rating: 5, tenantId: csc.id },
    { driverId: companyDrivers[3].id, vehicleId: vehicles[3].id, passengerId: passengers[3].id, scheduleId: schedules[3].id, sName: 'Bellville Station', sLat: -33.9006, sLng: 18.6290, eName: 'Cape Town CBD', eLat: -33.9249, eLng: 18.4241, price: 4000, fee: 500, method: PaymentMethod.EFT,    daysBack: 15, rating: 4, tenantId: csc.id },
    { driverId: companyDrivers[4].id, vehicleId: vehicles[4].id, passengerId: passengers[2].id, scheduleId: schedules[4].id, sName: 'Somerset West Mall', sLat: -34.0715, sLng: 18.8446, eName: 'Century City', eLat: -33.8925, eLng: 18.5135, price: 5500, fee: 500, method: PaymentMethod.WALLET, daysBack: 12, rating: 5, tenantId: csc.id },
    { driverId: companyDrivers[5].id, vehicleId: vehicles[5].id, passengerId: passengers[3].id, scheduleId: schedules[3].id, sName: 'Bellville Station', sLat: -33.9006, sLng: 18.6290, eName: 'Cape Town CBD', eLat: -33.9249, eLng: 18.4241, price: 4000, fee: 500, method: PaymentMethod.CASH,   daysBack:  3, rating: 4, tenantId: csc.id },
    // DRT
    { driverId: companyDrivers[6].id, vehicleId: vehicles[6].id, passengerId: passengers[4].id, scheduleId: schedules[5].id, sName: 'Pinetown Taxi Rank', sLat: -29.8179, sLng: 30.8574, eName: 'Durban CBD', eLat: -29.8587, eLng: 31.0218, price: 3000, fee: 500, method: PaymentMethod.CASH,   daysBack: 20, rating: 4, tenantId: drt.id },
    { driverId: companyDrivers[6].id, vehicleId: vehicles[6].id, passengerId: passengers[5].id, scheduleId: schedules[5].id, sName: 'Pinetown Taxi Rank', sLat: -29.8179, sLng: 30.8574, eName: 'Durban CBD', eLat: -29.8587, eLng: 31.0218, price: 3000, fee: 500, method: PaymentMethod.EFT,    daysBack: 13, rating: 5, tenantId: drt.id },
    { driverId: companyDrivers[7].id, vehicleId: vehicles[7].id, passengerId: passengers[4].id, scheduleId: schedules[6].id, sName: 'Umlazi Mega City', sLat: -29.9767, sLng: 30.8966, eName: 'Berea Centre', eLat: -29.8625, eLng: 31.0105, price: 2800, fee: 500, method: PaymentMethod.WALLET, daysBack:  9, rating: 3, tenantId: drt.id },
    { driverId: companyDrivers[8].id, vehicleId: vehicles[8].id, passengerId: passengers[5].id, scheduleId: schedules[5].id, sName: 'Pinetown Taxi Rank', sLat: -29.8179, sLng: 30.8574, eName: 'Durban CBD', eLat: -29.8587, eLng: 31.0218, price: 3000, fee: 500, method: PaymentMethod.CASH,   daysBack:  2, rating: 5, tenantId: drt.id },
  ]

  for (const t of companyTrips) {
    await makeTrip({
      tenantId: t.tenantId, driverId: t.driverId, vehicleId: t.vehicleId,
      passengerId: t.passengerId, scheduleId: t.scheduleId,
      tripType: TripType.SCHEDULED,
      startName: t.sName, startLat: t.sLat, startLng: t.sLng,
      endName: t.eName,   endLat: t.eLat,   endLng: t.eLng,
      basePrice: t.price, platformFee: t.fee, method: t.method,
      daysBack: t.daysBack, rating: t.rating,
    })
  }
  console.log(`  ✔ ${companyTrips.length} company scheduled trips`)

  // ── Independent driver on-demand trips (no tenant) ────────────────────────
  const indieTrips = [
    { driverId: indieDrivers[0].id, vehicleId: vehicles[9].id,  passengerId: passengers[6].id, sName: 'Rosebank Mall',      sLat: -26.1461, sLng: 28.0425, eName: 'OR Tambo Airport',   eLat: -26.1367, eLng: 28.2411, price: 25000, fee: 1000, method: PaymentMethod.CASH,   daysBack: 18, rating: 4 },
    { driverId: indieDrivers[1].id, vehicleId: vehicles[10].id, passengerId: passengers[7].id, sName: 'Waterfront, Cape Town',sLat: -33.9022, sLng: 18.4214, eName: 'Cape Town Airport', eLat: -33.9648, eLng: 18.5953, price: 18000, fee: 1000, method: PaymentMethod.EFT,    daysBack: 12, rating: 5 },
    { driverId: indieDrivers[2].id, vehicleId: vehicles[9].id,  passengerId: passengers[6].id, sName: 'Melrose Arch',        sLat: -26.1322, sLng: 28.0609, eName: 'Sandton City',      eLat: -26.1086, eLng: 28.0574, price: 8000,  fee: 500,  method: PaymentMethod.CASH,   daysBack:  7, rating: 4 },
    { driverId: indieDrivers[3].id, vehicleId: vehicles[10].id, passengerId: passengers[7].id, sName: 'Umhlanga Rocks',      sLat: -29.7249, sLng: 31.0811, eName: 'King Shaka Airport',eLat: -29.6144, eLng: 31.1197, price: 20000, fee: 1000, method: PaymentMethod.CASH,   daysBack:  5, rating: 5 },
    { driverId: indieDrivers[1].id, vehicleId: vehicles[10].id, passengerId: passengers[6].id, sName: 'Fourways Mall',       sLat: -26.0174, sLng: 28.0082, eName: 'Lanseria Airport',  eLat: -25.9385, eLng: 27.9260, price: 22000, fee: 1000, method: PaymentMethod.EFT,    daysBack:  1, rating: 5 },
  ]

  for (const t of indieTrips) {
    await makeTrip({
      tenantId: null, driverId: t.driverId, vehicleId: t.vehicleId,
      passengerId: t.passengerId,
      tripType: TripType.ON_DEMAND,
      startName: t.sName, startLat: t.sLat, startLng: t.sLng,
      endName: t.eName,   endLat: t.eLat,   endLng: t.eLng,
      basePrice: t.price, platformFee: t.fee, method: t.method,
      daysBack: t.daysBack, rating: t.rating,
    })
  }
  console.log(`  ✔ ${indieTrips.length} independent driver on-demand trips`)

  // ── Upcoming scheduled trips (future) ────────────────────────────────────
  const futureDate = hoursFromNow(20)
  const futureTrip = await prisma.trip.create({ data: {
    tenantId: jce.id,
    driverId: companyDrivers[0].id,
    vehicleId: vehicles[0].id,
    tripScheduleId: schedules[0].id,
    tripType: TripType.SCHEDULED,
    startLocationName: 'Sandton City', startLocationLat: -26.1086, startLocationLng: 28.0574,
    endLocationName: 'Johannesburg CBD', endLocationLat: -26.2041, endLocationLng: 28.0473,
    basePrice: 3500, platformFee: 500, totalPrice: 4000,
    scheduledStartTime: futureDate,
    status: TripStatus.SCHEDULED,
    availableSeats: 10,
  }})
  await prisma.booking.create({ data: {
    tenantId: jce.id,
    tripId: futureTrip.id,
    passengerId: passengers[0].id,
    driverId: companyDrivers[0].id,
    seatsBooked: 1,
    basePrice: 3500, platformFee: 500, totalPrice: 4000,
    status: BookingStatus.CONFIRMED,
  }})
  console.log('  ✔ 1 upcoming trip + booking')

  // ── Invoices ──────────────────────────────────────────────────────────────
  for (const t of tenants) {
    const mn = new Date(); mn.setDate(1); mn.setHours(0,0,0,0)
    const me = new Date(mn.getFullYear(), mn.getMonth()+1, 0, 23,59,59)
    const invNum = `INV-${t.slug.toUpperCase()}-${mn.getFullYear()}${String(mn.getMonth()+1).padStart(2,'0')}`
    await prisma.invoice.upsert({
      where: { invoiceNumber: invNum }, update: {},
      create: { tenantId: t.id, invoiceNumber: invNum, periodStart: mn, periodEnd: me, vehicleCount: 3, saasFeePerVehicle: t.saasFeePerVehicle, subtotal: 3 * t.saasFeePerVehicle, totalAmount: 3 * t.saasFeePerVehicle, dueDate: new Date(mn.getFullYear(), mn.getMonth()+1, 15), status: 'DRAFT' },
    })
  }
  console.log('  ✔ Monthly invoices (DRAFT)')

  console.log('\n✅ Seed complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('QUICK LOGIN ACCOUNTS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin (JCE):     admin@example.com   / admin123')
  console.log('Driver (JCE):    driver@example.com  / driver123')
  console.log('Passenger (JCE): passenger@example.com / passenger123')
  console.log('─────────────────────────────────────────────────')
  console.log('Indie driver 1:  indie1@driver.co.za / driver123')
  console.log('Indie driver 2:  indie2@driver.co.za / driver123')
  console.log('Indie driver 3:  indie3@driver.co.za / driver123')
  console.log('Indie driver 4:  indie4@driver.co.za / driver123')
  console.log('─────────────────────────────────────────────────')
  console.log('Indie passenger: indie.pass1@gmail.com / passenger123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
