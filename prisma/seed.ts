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
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)]
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000)
let refN = 1
const ref = () => `REF-SEED-${Date.now()}-${String(refN++).padStart(5, '0')}-${Math.random().toString(36).slice(2, 6)}`

// ── Cape Town Northern Suburbs coordinate map ─────────────────────────────
const STOPS = {
  bishopLavis:    { name: 'Bishop Lavis Civic Centre',   lat: -33.9217, lng: 18.5708 },
  parowStation:   { name: 'Parow Station',               lat: -33.9011, lng: 18.5985 },
  bellvilleStation:{ name: 'Bellville Station',          lat: -33.9006, lng: 18.6290 },
  tygervalley:    { name: 'Tygervalley Centre',          lat: -33.8745, lng: 18.6285 },
  panorama:       { name: 'Panorama Mediclinic',         lat: -33.8710, lng: 18.6005 },
  durbanville:    { name: 'Durbanville Town Centre',     lat: -33.8298, lng: 18.6580 },
  goodwood:       { name: 'Goodwood Station',            lat: -33.9064, lng: 18.5580 },
  maitland:       { name: 'Maitland Taxi Rank',          lat: -33.9198, lng: 18.5083 },
  cbdCloetesville:{ name: 'Cape Town CBD (Cloetesville)', lat: -33.9283, lng: 18.4241 },
  capeTownStation:{ name: 'Cape Town Station (Golden Acre)', lat: -33.9253, lng: 18.4245 },
  saltRiver:      { name: 'Salt River Station',          lat: -33.9296, lng: 18.4647 },
  observatory:    { name: 'Observatory',                 lat: -33.9394, lng: 18.4714 },
  athlone:        { name: 'Athlone Stadium',             lat: -33.9571, lng: 18.5052 },
  mitchellsPlain: { name: "Mitchell's Plain Town Centre", lat: -34.0385, lng: 18.6149 },
  airport:        { name: 'Cape Town International Airport', lat: -33.9648, lng: 18.5953 },
  centuryCityStation:{ name: 'Century City Station',    lat: -33.8924, lng: 18.5131 },
  vodacomPark:    { name: 'Vodacom Park, Bellville',     lat: -33.8955, lng: 18.6340 },
  kasselsvlei:    { name: 'Kasselsvlei Rd, Bishop Lavis', lat: -33.9178, lng: 18.5790 },
  losAngeles:     { name: 'Los Angeles, Bishop Lavis',   lat: -33.9240, lng: 18.5650 },
  nooiensfontein: { name: 'Nooiensfontein, Parow',       lat: -33.8921, lng: 18.6012 },
}

async function main() {
  console.log('🌱 Seeding Cape Town database...')

  const pw = (p: string) => bcrypt.hash(p, 10)

  // ════════════════════════════════════════════════════════════
  // 1. TENANTS — Cape Town focused
  // ════════════════════════════════════════════════════════════
  const tenantRows = [
    { name: 'Northern Suburbs Shuttle',  slug: 'nss', contactEmail: 'admin@nss.co.za', contactPhone: '+27 21 930 1111', primaryColor: '#1d4ed8', saasFeePerVehicle: 40000, bankAccountName: 'Northern Suburbs Shuttle', bankAccountNumber: '1001001001', bankName: 'FNB',          address: 'Bellville, Cape Town' },
    { name: 'Cape Flats Express',        slug: 'cfe', contactEmail: 'admin@cfe.co.za', contactPhone: '+27 21 633 2222', primaryColor: '#059669', saasFeePerVehicle: 35000, bankAccountName: 'Cape Flats Express',       bankAccountNumber: '2002002002', bankName: 'Nedbank',      address: 'Bishop Lavis, Cape Town' },
    { name: 'Metro Link Cape Town',      slug: 'mlc', contactEmail: 'admin@mlc.co.za', contactPhone: '+27 21 511 3333', primaryColor: '#7c3aed', saasFeePerVehicle: 45000, bankAccountName: 'Metro Link Cape Town',     bankAccountNumber: '3003003003', bankName: 'Standard Bank', address: 'Parow, Cape Town' },
  ]
  const tenants: any[] = []
  for (const td of tenantRows) {
    const t = await prisma.tenant.upsert({ where: { slug: td.slug }, update: {}, create: td })
    await prisma.tenantBilling.upsert({ where: { tenantId: t.id }, update: {}, create: { tenantId: t.id, billingCycle: 'MONTHLY', billingDay: 1, autoInvoice: true, bookingFeePercent: 7, saasFeePerVehicle: td.saasFeePerVehicle } })
    tenants.push(t)
    console.log(`  ✔ Tenant: ${t.name}`)
  }
  const [nss, cfe, mlc] = tenants

  // ════════════════════════════════════════════════════════════
  // 2. ADMIN USERS
  // ════════════════════════════════════════════════════════════
  const adminPw = await pw('admin123')
  const adminUser = await prisma.user.upsert({ where: { email: 'admin@example.com' }, update: {}, create: { email: 'admin@example.com', firstName: 'Super', lastName: 'Admin',        passwordHash: adminPw, role: UserRole.ADMIN, tenantId: nss.id, isActive: true } })
  await prisma.user.upsert({ where: { email: 'admin@nss.co.za' }, update: {}, create: { email: 'admin@nss.co.za', firstName: 'Warren',  lastName: 'September',  passwordHash: adminPw, role: UserRole.ADMIN, tenantId: nss.id, isActive: true } })
  await prisma.user.upsert({ where: { email: 'admin@cfe.co.za' }, update: {}, create: { email: 'admin@cfe.co.za', firstName: 'Gadija',  lastName: 'Davids',     passwordHash: adminPw, role: UserRole.ADMIN, tenantId: cfe.id, isActive: true } })
  await prisma.user.upsert({ where: { email: 'admin@mlc.co.za' }, update: {}, create: { email: 'admin@mlc.co.za', firstName: 'Tyrone',  lastName: 'Hendricks',  passwordHash: adminPw, role: UserRole.ADMIN, tenantId: mlc.id, isActive: true } })
  console.log('  ✔ Admin users')

  // ════════════════════════════════════════════════════════════
  // 3. DRIVERS — Cape Town Northern Suburbs locals
  // ════════════════════════════════════════════════════════════
  const driverPw = await pw('driver123')
  const driverRows = [
    // NSS — Bellville/Parow based
    { email: 'driver@example.com',   firstName: 'Richaad',   lastName: 'Davids',    phone: '+27 72 321 0001', tenantId: nss.id, tier: DriverTier.VERIFIED, rating: 4.8, reviews: 87,  wallet: 220000, lat: -33.9006, lng: 18.6290 },
    { email: 'yusuf@nss.co.za',      firstName: 'Yusuf',     lastName: 'Arends',    phone: '+27 72 321 0002', tenantId: nss.id, tier: DriverTier.PREMIUM,  rating: 4.9, reviews: 143, wallet: 380000, lat: -33.9011, lng: 18.5985 },
    { email: 'chantal@nss.co.za',    firstName: 'Chantal',   lastName: 'Fortuin',   phone: '+27 72 321 0003', tenantId: nss.id, tier: DriverTier.FREE,     rating: 4.4, reviews: 31,  wallet: 95000,  lat: -33.8745, lng: 18.6285 },
    // CFE — Bishop Lavis / Cape Flats based
    { email: 'driver@cfe.co.za',     firstName: 'Shafiek',   lastName: 'Jacobs',    phone: '+27 83 422 0001', tenantId: cfe.id, tier: DriverTier.VERIFIED, rating: 4.7, reviews: 62,  wallet: 185000, lat: -33.9217, lng: 18.5708 },
    { email: 'nadia@cfe.co.za',      firstName: 'Nadia',     lastName: 'Abrahams',  phone: '+27 83 422 0002', tenantId: cfe.id, tier: DriverTier.FREE,     rating: 4.3, reviews: 19,  wallet: 67000,  lat: -33.9178, lng: 18.5790 },
    { email: 'gavin@cfe.co.za',      firstName: 'Gavin',     lastName: 'Williams',  phone: '+27 83 422 0003', tenantId: cfe.id, tier: DriverTier.PREMIUM,  rating: 4.6, reviews: 94,  wallet: 290000, lat: -33.9240, lng: 18.5650 },
    // MLC — Parow / Goodwood based
    { email: 'driver@mlc.co.za',     firstName: 'Brandon',   lastName: 'Petersen',  phone: '+27 61 533 0001', tenantId: mlc.id, tier: DriverTier.VERIFIED, rating: 4.5, reviews: 44,  wallet: 140000, lat: -33.9064, lng: 18.5580 },
    { email: 'leila@mlc.co.za',      firstName: 'Leila',     lastName: 'Hendricks', phone: '+27 61 533 0002', tenantId: mlc.id, tier: DriverTier.FREE,     rating: 4.2, reviews: 12,  wallet: 48000,  lat: -33.9011, lng: 18.5985 },
    { email: 'divan@mlc.co.za',      firstName: 'Divan',     lastName: 'Louw',      phone: '+27 61 533 0003', tenantId: mlc.id, tier: DriverTier.PREMIUM,  rating: 4.8, reviews: 119, wallet: 340000, lat: -33.8710, lng: 18.6005 },
  ]
  const companyDrivers: any[] = []
  for (const d of driverRows) {
    const u = await prisma.user.upsert({
      where: { email: d.email }, update: {},
      create: { email: d.email, firstName: d.firstName, lastName: d.lastName, phoneNumber: d.phone, passwordHash: driverPw, role: UserRole.DRIVER, tenantId: d.tenantId, driverStatus: DriverStatus.ONLINE, driverTier: d.tier, driverRating: d.rating, driverReviewCount: d.reviews, driverLicenseNumber: `DL${rand(100000, 999999)}`, driverLicenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), isActive: true, walletBalance: d.wallet, currentLocationLat: d.lat, currentLocationLng: d.lng, lastLocationUpdate: new Date() },
    })
    companyDrivers.push(u)
  }
  console.log(`  ✔ ${companyDrivers.length} company drivers`)

  // ── Independent drivers (no tenant)
  const indieRows = [
    { email: 'indie1@driver.co.za', firstName: 'Ashraf',   lastName: 'Kannemeyer', phone: '+27 60 600 0001', tier: DriverTier.FREE,     rating: 4.2, reviews: 11, wallet: 38000,  lat: -33.9217, lng: 18.5708 },
    { email: 'indie2@driver.co.za', firstName: 'Zelda',    lastName: 'Erasmus',    phone: '+27 60 600 0002', tier: DriverTier.VERIFIED, rating: 4.7, reviews: 48, wallet: 125000, lat: -33.9006, lng: 18.6290 },
    { email: 'indie3@driver.co.za', firstName: 'Mogamat',  lastName: 'Salie',      phone: '+27 60 600 0003', tier: DriverTier.FREE,     rating: 4.0, reviews: 7,  wallet: 22000,  lat: -33.9011, lng: 18.5985 },
    { email: 'indie4@driver.co.za', firstName: 'Marchell', lastName: 'Adams',      phone: '+27 60 600 0004', tier: DriverTier.PREMIUM,  rating: 4.9, reviews: 73, wallet: 270000, lat: -33.9064, lng: 18.5580 },
  ]
  const indieDrivers: any[] = []
  for (const d of indieRows) {
    const u = await prisma.user.upsert({
      where: { email: d.email }, update: {},
      create: { email: d.email, firstName: d.firstName, lastName: d.lastName, phoneNumber: d.phone, passwordHash: driverPw, role: UserRole.DRIVER, tenantId: null, driverStatus: DriverStatus.ONLINE, driverTier: d.tier, driverRating: d.rating, driverReviewCount: d.reviews, driverLicenseNumber: `DL${rand(100000, 999999)}`, driverLicenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), isActive: true, walletBalance: d.wallet, currentLocationLat: d.lat, currentLocationLng: d.lng, lastLocationUpdate: new Date() },
    })
    indieDrivers.push(u)
  }
  console.log(`  ✔ ${indieDrivers.length} independent drivers`)

  // ════════════════════════════════════════════════════════════
  // 4. PASSENGERS — local commuters
  // ════════════════════════════════════════════════════════════
  const passPw = await pw('passenger123')
  const passRows = [
    { email: 'passenger@example.com', firstName: 'Tasneem',  lastName: 'Davids',    phone: '+27 73 100 0001', tenantId: nss.id, wallet: 25000 },
    { email: 'shaun@nss.co.za',       firstName: 'Shaun',    lastName: 'Manuel',    phone: '+27 73 100 0002', tenantId: nss.id, wallet: 50000 },
    { email: 'bianca@nss.co.za',      firstName: 'Bianca',   lastName: 'February',  phone: '+27 73 100 0003', tenantId: nss.id, wallet: 18000 },
    { email: 'imraan@cfe.co.za',      firstName: 'Imraan',   lastName: 'Salie',     phone: '+27 73 100 0004', tenantId: cfe.id, wallet: 35000 },
    { email: 'liezel@cfe.co.za',      firstName: 'Liezel',   lastName: 'du Plessis',phone: '+27 73 100 0005', tenantId: cfe.id, wallet: 12000 },
    { email: 'ebrahim@mlc.co.za',     firstName: 'Ebrahim',  lastName: 'Isaacs',    phone: '+27 73 100 0006', tenantId: mlc.id, wallet: 60000 },
    { email: 'cheryl@mlc.co.za',      firstName: 'Cheryl',   lastName: 'Cloete',    phone: '+27 73 100 0007', tenantId: mlc.id, wallet: 8000  },
    { email: 'indie.pass1@gmail.com', firstName: 'Rowan',    lastName: 'Carolus',   phone: '+27 79 700 0001', tenantId: null,   wallet: 0     },
    { email: 'indie.pass2@gmail.com', firstName: 'Maryam',   lastName: 'Hendricks', phone: '+27 79 700 0002', tenantId: null,   wallet: 15000 },
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
  // 5. VEHICLES
  // ════════════════════════════════════════════════════════════
  const vehicleRows = [
    { reg: 'NSS001WP', make: 'Toyota',  model: 'Quantum',  year: 2022, color: 'White',  capacity: 14, tenantId: nss.id },
    { reg: 'NSS002WP', make: 'Toyota',  model: 'Quantum',  year: 2023, color: 'Silver', capacity: 14, tenantId: nss.id },
    { reg: 'NSS003WP', make: 'VW',      model: 'Crafter',  year: 2022, color: 'White',  capacity: 16, tenantId: nss.id },
    { reg: 'CFE001WP', make: 'Toyota',  model: 'HiAce',    year: 2021, color: 'Yellow', capacity: 14, tenantId: cfe.id },
    { reg: 'CFE002WP', make: 'Hyundai', model: 'H350',     year: 2022, color: 'White',  capacity: 12, tenantId: cfe.id },
    { reg: 'CFE003WP', make: 'Toyota',  model: 'Quantum',  year: 2020, color: 'Blue',   capacity: 14, tenantId: cfe.id },
    { reg: 'MLC001WP', make: 'Ford',    model: 'Transit',  year: 2023, color: 'Grey',   capacity: 15, tenantId: mlc.id },
    { reg: 'MLC002WP', make: 'Nissan',  model: 'NV350',    year: 2021, color: 'White',  capacity: 15, tenantId: mlc.id },
    { reg: 'MLC003WP', make: 'VW',      model: 'Transporter', year: 2022, color: 'Black', capacity: 8, tenantId: mlc.id },
    { reg: 'IND001WP', make: 'Toyota',  model: 'Corolla',  year: 2021, color: 'White',  capacity: 4,  tenantId: nss.id },
    { reg: 'IND002WP', make: 'VW',      model: 'Polo',     year: 2020, color: 'Silver', capacity: 4,  tenantId: nss.id },
  ]
  const vehicles: any[] = []
  for (const v of vehicleRows) {
    const veh = await prisma.vehicle.upsert({
      where: { registrationNumber: v.reg }, update: {},
      create: { registrationNumber: v.reg, make: v.make, model: v.model, year: v.year, color: v.color, capacity: v.capacity, tenantId: v.tenantId, vehicleType: v.capacity > 8 ? 'MINIBUS' : v.capacity > 4 ? 'VAN' : 'SEDAN', isActive: true },
    })
    vehicles.push(veh)
  }
  console.log(`  ✔ ${vehicles.length} vehicles`)

  // ════════════════════════════════════════════════════════════
  // 6. TRIP SCHEDULES — real Cape Town Northern Suburbs routes
  // ════════════════════════════════════════════════════════════
  const S = STOPS
  const scheduleRows = [
    // NSS routes
    { tenantId: nss.id, driverId: companyDrivers[0].id, name: 'Bishop Lavis → Cape Town CBD (Morning)',  start: S.bishopLavis,      end: S.capeTownStation,   price: 2500, time: '06:30', desc: 'Daily morning commuter from Bishop Lavis via Goodwood to Cape Town Station' },
    { tenantId: nss.id, driverId: companyDrivers[1].id, name: 'Parow → Bellville → Cape Town CBD',       start: S.parowStation,     end: S.capeTownStation,   price: 2800, time: '07:00', desc: 'Stops at Bellville Station before heading into the CBD' },
    { tenantId: nss.id, driverId: companyDrivers[2].id, name: 'Bellville → Tygervalley Shuttle',         start: S.bellvilleStation, end: S.tygervalley,       price: 1500, time: '08:00', desc: 'Short hop from Bellville Station to Tygervalley Centre' },
    { tenantId: nss.id, driverId: companyDrivers[0].id, name: 'Bellville → Century City (Office Park)',  start: S.bellvilleStation, end: S.centuryCityStation, price: 2000, time: '07:30', desc: 'Direct route to Century City for office workers' },
    // CFE routes
    { tenantId: cfe.id, driverId: companyDrivers[3].id, name: "Bishop Lavis → Athlone → Salt River",     start: S.bishopLavis,      end: S.saltRiver,         price: 2200, time: '06:45', desc: 'Via Athlone, connecting Cape Flats to Salt River industrial area' },
    { tenantId: cfe.id, driverId: companyDrivers[4].id, name: "Los Angeles → Goodwood → Parow Station",  start: S.losAngeles,       end: S.parowStation,      price: 1800, time: '07:15', desc: 'From Los Angeles section of Bishop Lavis to Parow rail connection' },
    { tenantId: cfe.id, driverId: companyDrivers[5].id, name: "Bishop Lavis → Cape Town Airport",        start: S.bishopLavis,      end: S.airport,           price: 3500, time: '05:00', desc: 'Early morning airport transfer from Bishop Lavis' },
    // MLC routes
    { tenantId: mlc.id, driverId: companyDrivers[6].id, name: "Goodwood → Maitland → CBD Express",       start: S.goodwood,         end: S.capeTownStation,   price: 2300, time: '07:00', desc: 'Express service via Maitland to Cape Town Station' },
    { tenantId: mlc.id, driverId: companyDrivers[7].id, name: "Parow → Panorama Medical → Durbanville",  start: S.parowStation,     end: S.durbanville,       price: 2600, time: '08:30', desc: 'Stops at Panorama Mediclinic, ideal for medical appointments' },
    { tenantId: mlc.id, driverId: companyDrivers[8].id, name: "Bellville → Observatory via Salt River",  start: S.bellvilleStation, end: S.observatory,       price: 3000, time: '07:45', desc: 'Via Salt River through to Observatory for UCT/hospital workers' },
  ]
  const schedules: any[] = []
  for (const s of scheduleRows) {
    const sch = await prisma.tripSchedule.create({
      data: {
        tenantId: s.tenantId, driverId: s.driverId,
        name: s.name, description: s.desc,
        startLocationName: s.start.name, startLocationLat: s.start.lat, startLocationLng: s.start.lng,
        endLocationName:   s.end.name,   endLocationLat:   s.end.lat,   endLocationLng:   s.end.lng,
        basePrice: s.price, startTime: s.time,
        recurrenceType: 'WEEKDAYS', daysOfWeek: [1,2,3,4,5],
        effectiveFrom: daysAgo(90), isActive: true,
        status: 'ACTIVE',
      },
    })
    schedules.push(sch)
    console.log(`    ✔ Schedule: ${s.name}`)
  }

  // ════════════════════════════════════════════════════════════
  // 7. COMPLETED TRIPS + BOOKINGS + PAYMENTS + REVIEWS + MESSAGES
  // ════════════════════════════════════════════════════════════
  const reviewComments = [
    'Sharp driver, always on time. Will use again!',
    'Very professional, clean vehicle.',
    'Knew the route perfectly, no unnecessary stops.',
    'Friendly and safe driver, highly recommend.',
    'Good trip, arrived right on time.',
    'Bit late but overall decent service.',
    'Great service, priced fairly for the area.',
    'Driver was polite and vehicle was spotless.',
  ]
  const driverMsgs = [
    "Good morning, I'm on my way to the pickup point.",
    "Running 5 minutes late, heavy traffic near Bellville.",
    "I have arrived at the pickup location.",
    "Heading to destination now, ETA 20 minutes.",
    "Trip completed, thank you for riding with us!",
    "Please be at the stop by 6:45, departing sharp.",
  ]
  const passMsgs = [
    "Morning! I'm at the stop.",
    "Please wait, I'm 2 minutes away.",
    "Thanks, see you at the usual spot.",
    "Can you stop at Parow Station first?",
    "Safe drive, see you tomorrow.",
    "Any chance of an earlier pickup tomorrow?",
  ]

  async function makeTrip(opts: {
    tenantId: string | null
    driverId: string; vehicleId: string; passengerId: string; scheduleId?: string
    tripType: TripType
    start: { name: string; lat: number; lng: number }
    end:   { name: string; lat: number; lng: number }
    basePrice: number; platformFee: number; method: PaymentMethod
    daysBack: number; rating?: number; addMessages?: boolean
  }) {
    const tId = (opts.tenantId ?? nss.id) as string
    const totalPrice = opts.basePrice + opts.platformFee
    const tripStart = daysAgo(opts.daysBack)
    tripStart.setHours(rand(5, 9), rand(0, 59))
    const tripEnd = new Date(tripStart.getTime() + rand(20, 55) * 60_000)

    const trip = await prisma.trip.create({ data: {
      tenantId: tId, driverId: opts.driverId, vehicleId: opts.vehicleId,
      tripScheduleId: opts.scheduleId ?? null,
      tripType: opts.tripType,
      startLocationName: opts.start.name, startLocationLat: opts.start.lat, startLocationLng: opts.start.lng,
      endLocationName:   opts.end.name,   endLocationLat:   opts.end.lat,   endLocationLng:   opts.end.lng,
      basePrice: opts.basePrice, platformFee: opts.platformFee, totalPrice,
      scheduledStartTime: tripStart, actualStartTime: tripStart, actualEndTime: tripEnd,
      status: TripStatus.COMPLETED, availableSeats: rand(4, 14),
    }})

    const booking = await prisma.booking.create({ data: {
      tenantId: tId, tripId: trip.id,
      passengerId: opts.passengerId, driverId: opts.driverId,
      seatsBooked: 1, basePrice: opts.basePrice, platformFee: opts.platformFee, totalPrice,
      status: BookingStatus.COMPLETED, attended: true, attendanceMarkedAt: tripEnd,
    }})

    await prisma.payment.create({ data: {
      tenantId: tId, userId: opts.passengerId, tripId: trip.id, bookingId: booking.id,
      amount: totalPrice, platformFee: opts.platformFee, method: opts.method,
      status: PaymentStatus.COMPLETED, reference: ref(),
      collectedByDriverId: opts.method === PaymentMethod.CASH ? opts.driverId : null,
      verifiedAt: opts.method !== PaymentMethod.CASH ? tripEnd : null,
    }})

    if (opts.rating) {
      const r = opts.rating
      await prisma.review.create({ data: {
        bookingId: booking.id, reviewerId: opts.passengerId, driverId: opts.driverId,
        rating: r,
        punctuality:   Math.min(5, r + (Math.random() > 0.5 ? 0 : -1)),
        cleanliness:   Math.min(5, r + (Math.random() > 0.5 ? 0 : -1)),
        drivingSkill:  r,
        communication: Math.min(5, r + (Math.random() > 0.5 ? 1 : 0)),
        comment: pick(reviewComments),
        isVisible: true,
      }}).catch(() => null)
    }

    if (opts.addMessages) {
      const msgTime = (offsetMin: number) => new Date(tripStart.getTime() - offsetMin * 60_000)
      await prisma.message.create({ data: { tenantId: tId, tripId: trip.id, senderId: opts.driverId,    receiverId: opts.passengerId, content: pick(driverMsgs), isRead: true, readAt: msgTime(25), createdAt: msgTime(30) } })
      await prisma.message.create({ data: { tenantId: tId, tripId: trip.id, senderId: opts.passengerId, receiverId: opts.driverId,    content: pick(passMsgs),   isRead: true, readAt: msgTime(20), createdAt: msgTime(25) } })
      await prisma.message.create({ data: { tenantId: tId, tripId: trip.id, senderId: opts.driverId,    receiverId: opts.passengerId, content: pick(driverMsgs), isRead: true, readAt: msgTime(10), createdAt: msgTime(15) } })
    }

    await prisma.auditLog.create({ data: {
      userId: opts.driverId, tenantId: tId,
      action: 'TRIP_COMPLETED', entityType: 'Trip', entityId: trip.id,
    }})

    return { trip, booking }
  }

  // ── Completed trips — rich Cape Town routes ──────────────────────────────
  type TripDef = { dIdx: number; vIdx: number; pIdx: number; sIdx?: number; start: typeof S[keyof typeof S]; end: typeof S[keyof typeof S]; price: number; fee: number; method: PaymentMethod; days: number; rating: number; tId: string; msgs?: boolean }
  const tripDefs: TripDef[] = [
    // NSS completed trips
    { dIdx:0, vIdx:0, pIdx:0, sIdx:0, start:S.bishopLavis,      end:S.capeTownStation,    price:2500, fee:175, method:PaymentMethod.CASH,   days:35, rating:5, tId:nss.id, msgs:true },
    { dIdx:0, vIdx:0, pIdx:1, sIdx:0, start:S.bishopLavis,      end:S.capeTownStation,    price:2500, fee:175, method:PaymentMethod.EFT,    days:28, rating:4, tId:nss.id, msgs:true },
    { dIdx:0, vIdx:0, pIdx:2, sIdx:0, start:S.bishopLavis,      end:S.capeTownStation,    price:2500, fee:175, method:PaymentMethod.CASH,   days:21, rating:5, tId:nss.id },
    { dIdx:0, vIdx:0, pIdx:0, sIdx:0, start:S.bishopLavis,      end:S.capeTownStation,    price:2500, fee:175, method:PaymentMethod.WALLET, days:14, rating:5, tId:nss.id },
    { dIdx:1, vIdx:1, pIdx:1, sIdx:1, start:S.parowStation,     end:S.capeTownStation,    price:2800, fee:196, method:PaymentMethod.CASH,   days:30, rating:4, tId:nss.id, msgs:true },
    { dIdx:1, vIdx:1, pIdx:2, sIdx:1, start:S.parowStation,     end:S.capeTownStation,    price:2800, fee:196, method:PaymentMethod.EFT,    days:22, rating:5, tId:nss.id },
    { dIdx:1, vIdx:1, pIdx:0, sIdx:1, start:S.parowStation,     end:S.capeTownStation,    price:2800, fee:196, method:PaymentMethod.CASH,   days:15, rating:4, tId:nss.id },
    { dIdx:2, vIdx:2, pIdx:2, sIdx:2, start:S.bellvilleStation, end:S.tygervalley,        price:1500, fee:105, method:PaymentMethod.CASH,   days:20, rating:5, tId:nss.id, msgs:true },
    { dIdx:2, vIdx:2, pIdx:1, sIdx:3, start:S.bellvilleStation, end:S.centuryCityStation, price:2000, fee:140, method:PaymentMethod.EFT,    days:12, rating:4, tId:nss.id },
    { dIdx:0, vIdx:0, pIdx:2, sIdx:3, start:S.bellvilleStation, end:S.centuryCityStation, price:2000, fee:140, method:PaymentMethod.WALLET, days:6,  rating:5, tId:nss.id },
    // CFE completed trips
    { dIdx:3, vIdx:3, pIdx:3, sIdx:4, start:S.bishopLavis,      end:S.saltRiver,          price:2200, fee:154, method:PaymentMethod.CASH,   days:32, rating:4, tId:cfe.id, msgs:true },
    { dIdx:3, vIdx:3, pIdx:4, sIdx:4, start:S.bishopLavis,      end:S.saltRiver,          price:2200, fee:154, method:PaymentMethod.CASH,   days:25, rating:5, tId:cfe.id },
    { dIdx:3, vIdx:3, pIdx:3, sIdx:4, start:S.bishopLavis,      end:S.saltRiver,          price:2200, fee:154, method:PaymentMethod.EFT,    days:18, rating:5, tId:cfe.id, msgs:true },
    { dIdx:4, vIdx:4, pIdx:4, sIdx:5, start:S.losAngeles,       end:S.parowStation,       price:1800, fee:126, method:PaymentMethod.CASH,   days:27, rating:3, tId:cfe.id },
    { dIdx:4, vIdx:4, pIdx:3, sIdx:5, start:S.losAngeles,       end:S.parowStation,       price:1800, fee:126, method:PaymentMethod.CASH,   days:19, rating:4, tId:cfe.id },
    { dIdx:5, vIdx:5, pIdx:4, sIdx:6, start:S.bishopLavis,      end:S.airport,            price:3500, fee:245, method:PaymentMethod.EFT,    days:10, rating:5, tId:cfe.id, msgs:true },
    { dIdx:5, vIdx:5, pIdx:3, sIdx:6, start:S.bishopLavis,      end:S.airport,            price:3500, fee:245, method:PaymentMethod.CASH,   days:4,  rating:5, tId:cfe.id },
    // MLC completed trips
    { dIdx:6, vIdx:6, pIdx:5, sIdx:7, start:S.goodwood,         end:S.capeTownStation,    price:2300, fee:161, method:PaymentMethod.CASH,   days:33, rating:4, tId:mlc.id, msgs:true },
    { dIdx:6, vIdx:6, pIdx:6, sIdx:7, start:S.goodwood,         end:S.capeTownStation,    price:2300, fee:161, method:PaymentMethod.EFT,    days:26, rating:5, tId:mlc.id },
    { dIdx:7, vIdx:7, pIdx:5, sIdx:8, start:S.parowStation,     end:S.durbanville,        price:2600, fee:182, method:PaymentMethod.WALLET, days:23, rating:5, tId:mlc.id, msgs:true },
    { dIdx:7, vIdx:7, pIdx:6, sIdx:8, start:S.parowStation,     end:S.durbanville,        price:2600, fee:182, method:PaymentMethod.CASH,   days:17, rating:4, tId:mlc.id },
    { dIdx:8, vIdx:8, pIdx:5, sIdx:9, start:S.bellvilleStation, end:S.observatory,        price:3000, fee:210, method:PaymentMethod.EFT,    days:11, rating:5, tId:mlc.id, msgs:true },
    { dIdx:8, vIdx:8, pIdx:6, sIdx:9, start:S.bellvilleStation, end:S.observatory,        price:3000, fee:210, method:PaymentMethod.CASH,   days:5,  rating:4, tId:mlc.id },
    // On-demand indie trips
    { dIdx:10,vIdx:9, pIdx:7,          start:S.bishopLavis,      end:S.capeTownStation,    price:4000, fee:280, method:PaymentMethod.CASH,   days:20, rating:4, tId:nss.id, msgs:true },
    { dIdx:11,vIdx:10,pIdx:8,          start:S.parowStation,     end:S.airport,            price:5500, fee:385, method:PaymentMethod.EFT,    days:14, rating:5, tId:nss.id, msgs:true },
    { dIdx:12,vIdx:9, pIdx:7,          start:S.bellvilleStation, end:S.mitchellsPlain,     price:4500, fee:315, method:PaymentMethod.CASH,   days:8,  rating:4, tId:nss.id },
    { dIdx:13,vIdx:10,pIdx:8,          start:S.goodwood,         end:S.tygervalley,        price:3000, fee:210, method:PaymentMethod.CASH,   days:3,  rating:5, tId:nss.id },
  ]

  let tripCount = 0
  for (const t of tripDefs) {
    const isIndie = t.dIdx >= 10
    await makeTrip({
      tenantId: isIndie ? null : t.tId,
      driverId:    isIndie ? indieDrivers[t.dIdx - 10].id : companyDrivers[t.dIdx].id,
      vehicleId:   vehicles[t.vIdx].id,
      passengerId: passengers[t.pIdx].id,
      scheduleId:  t.sIdx !== undefined ? schedules[t.sIdx].id : undefined,
      tripType:    isIndie ? TripType.ON_DEMAND : TripType.SCHEDULED,
      start: t.start, end: t.end,
      basePrice: t.price, platformFee: t.fee, method: t.method,
      daysBack: t.days, rating: t.rating, addMessages: t.msgs,
    })
    tripCount++
  }
  console.log(`  ✔ ${tripCount} completed trips (with bookings, payments, reviews, messages)`)

  // ════════════════════════════════════════════════════════════
  // 8. UPCOMING TRIPS (SCHEDULED — future)
  // ════════════════════════════════════════════════════════════
  const upcomingDefs = [
    { dIdx:0, vIdx:0, pIdx:0, sIdx:0, start:S.bishopLavis,      end:S.capeTownStation,    price:2500, fee:175, hoursAhead:14, tId:nss.id },
    { dIdx:1, vIdx:1, pIdx:1, sIdx:1, start:S.parowStation,     end:S.capeTownStation,    price:2800, fee:196, hoursAhead:16, tId:nss.id },
    { dIdx:3, vIdx:3, pIdx:3, sIdx:4, start:S.bishopLavis,      end:S.saltRiver,          price:2200, fee:154, hoursAhead:18, tId:cfe.id },
    { dIdx:6, vIdx:6, pIdx:5, sIdx:7, start:S.goodwood,         end:S.capeTownStation,    price:2300, fee:161, hoursAhead:20, tId:mlc.id },
    { dIdx:5, vIdx:5, pIdx:4, sIdx:6, start:S.bishopLavis,      end:S.airport,            price:3500, fee:245, hoursAhead:10, tId:cfe.id },
  ]
  for (const u of upcomingDefs) {
    const totalPrice = u.price + u.fee
    const ft = await prisma.trip.create({ data: {
      tenantId: u.tId, driverId: companyDrivers[u.dIdx].id, vehicleId: vehicles[u.vIdx].id,
      tripScheduleId: schedules[u.sIdx].id, tripType: TripType.SCHEDULED,
      startLocationName: u.start.name, startLocationLat: u.start.lat, startLocationLng: u.start.lng,
      endLocationName:   u.end.name,   endLocationLat:   u.end.lat,   endLocationLng:   u.end.lng,
      basePrice: u.price, platformFee: u.fee, totalPrice,
      scheduledStartTime: hoursFromNow(u.hoursAhead),
      status: TripStatus.SCHEDULED, availableSeats: rand(6, 12),
    }})
    await prisma.booking.create({ data: {
      tenantId: u.tId, tripId: ft.id,
      passengerId: passengers[u.pIdx].id, driverId: companyDrivers[u.dIdx].id,
      seatsBooked: 1, basePrice: u.price, platformFee: u.fee, totalPrice,
      status: BookingStatus.CONFIRMED,
    }})
    // Pre-trip message
    await prisma.message.create({ data: {
      tenantId: u.tId, tripId: ft.id,
      senderId: companyDrivers[u.dIdx].id, receiverId: passengers[u.pIdx].id,
      content: `Please be at ${u.start.name} by ${u.hoursAhead < 12 ? '05:00' : '06:30'} tomorrow. See you then!`,
      isRead: false, createdAt: new Date(),
    }})
  }
  console.log(`  ✔ ${upcomingDefs.length} upcoming trips + bookings + pre-trip messages`)

  // ════════════════════════════════════════════════════════════
  // 9. UNREAD INBOX MESSAGES (not trip-linked — general chat)
  // ════════════════════════════════════════════════════════════
  const inboxMsgs = [
    { from: companyDrivers[0], to: passengers[0], content: "Hi Tasneem, just confirming your regular Monday pickup at Bishop Lavis Civic Centre at 06:30.", tid: nss.id },
    { from: passengers[0],     to: companyDrivers[0], content: "Thanks Richaad! I'll be there. Can you add a stop at Kasselsvlei Rd?", tid: nss.id },
    { from: companyDrivers[1], to: passengers[1], content: "Good afternoon Shaun. Tomorrow's trip to CBD may be slightly early — departing Parow at 06:50.", tid: nss.id },
    { from: passengers[3],     to: companyDrivers[3], content: "Shafiek, I need to change my drop-off to Salt River Station please.", tid: cfe.id },
    { from: companyDrivers[3], to: passengers[3], content: "No problem Imraan, I'll note that. Salt River Station it is.", tid: cfe.id },
    { from: passengers[5],     to: companyDrivers[6], content: "Brandon, can I book an extra seat for a colleague tomorrow?", tid: mlc.id },
    { from: companyDrivers[6], to: passengers[5], content: "Of course Ebrahim, I have space. Please confirm by 5pm today.", tid: mlc.id },
    { from: adminUser,          to: companyDrivers[0], content: "Reminder: vehicle NSS001WP service is due next week. Please arrange.", tid: nss.id },
  ]
  for (const m of inboxMsgs) {
    await prisma.message.create({ data: {
      tenantId: m.tid, senderId: m.from.id, receiverId: m.to.id,
      content: m.content, isRead: false, createdAt: new Date(Date.now() - rand(1, 48) * 3_600_000),
    }})
  }
  console.log(`  ✔ ${inboxMsgs.length} unread inbox messages`)

  // ════════════════════════════════════════════════════════════
  // 10. INVOICES
  // ════════════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════════════
  // 11. AUDIT LOGS
  // ════════════════════════════════════════════════════════════
  const auditEntries = [
    { userId: adminUser.id,          tenantId: nss.id, action: 'TENANT_CREATED',    entityType: 'Tenant', entityId: nss.id },
    { userId: adminUser.id,          tenantId: cfe.id, action: 'TENANT_CREATED',    entityType: 'Tenant', entityId: cfe.id },
    { userId: adminUser.id,          tenantId: mlc.id, action: 'TENANT_CREATED',    entityType: 'Tenant', entityId: mlc.id },
    { userId: companyDrivers[0].id,  tenantId: nss.id, action: 'TRIP_STARTED',      entityType: 'Trip',   entityId: nss.id },
    { userId: companyDrivers[3].id,  tenantId: cfe.id, action: 'TRIP_COMPLETED',    entityType: 'Trip',   entityId: cfe.id },
    { userId: adminUser.id,          tenantId: nss.id, action: 'PAYMENT_VERIFIED',  entityType: 'Payment',entityId: nss.id },
    { userId: passengers[0].id,      tenantId: nss.id, action: 'BOOKING_CREATED',   entityType: 'Booking',entityId: nss.id },
    { userId: passengers[3].id,      tenantId: cfe.id, action: 'REVIEW_SUBMITTED',  entityType: 'Review', entityId: cfe.id },
  ]
  for (const a of auditEntries) {
    await prisma.auditLog.create({ data: { ...a, ipAddress: `102.${rand(1,254)}.${rand(1,254)}.${rand(1,254)}` } })
  }
  console.log(`  ✔ ${auditEntries.length} audit log entries`)

  console.log('\n✅ Cape Town Seed Complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('QUICK LOGIN ACCOUNTS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin:     admin@example.com       / admin123')
  console.log('Driver:    driver@example.com      / driver123  (NSS, Bellville)')
  console.log('Passenger: passenger@example.com   / passenger123  (Bishop Lavis commuter)')
  console.log('────────────────────────────────────────────────────────')
  console.log('CFE Driver:  driver@cfe.co.za      / driver123  (Bishop Lavis)')
  console.log('MLC Driver:  driver@mlc.co.za      / driver123  (Goodwood/Parow)')
  console.log('────────────────────────────────────────────────────────')
  console.log('Indie driver 1: indie1@driver.co.za / driver123')
  console.log('Indie driver 2: indie2@driver.co.za / driver123')
  console.log('────────────────────────────────────────────────────────')
  console.log('Indie passenger: indie.pass1@gmail.com / passenger123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nROUTES SEEDED (Bishop Lavis / Parow / Bellville area):')
  console.log('  • Bishop Lavis → Cape Town CBD (Morning)')
  console.log('  • Parow → Bellville → Cape Town CBD')
  console.log('  • Bellville → Tygervalley Shuttle')
  console.log('  • Bellville → Century City (Office Park)')
  console.log('  • Bishop Lavis → Athlone → Salt River')
  console.log('  • Los Angeles → Goodwood → Parow Station')
  console.log('  • Bishop Lavis → Cape Town Airport (Early AM)')
  console.log('  • Goodwood → Maitland → CBD Express')
  console.log('  • Parow → Panorama Medical → Durbanville')
  console.log('  • Bellville → Observatory via Salt River')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
