# Transport SaaS

Multi-tenant transport management platform supporting both on-demand ride-hailing and scheduled commuter bookings.

## Features

- **Dual Transport Models**: On-demand (Uber-like) and scheduled commuter routes
- **Multi-Tenancy**: Fleet companies have isolated data and branding
- **Role-Based Access**: Admin, Driver, and Passenger dashboards
- **Payment Options**: EFT (bank transfer) and Cash - no transaction fees for MVP
- **Real-Time Tracking**: GPS tracking via Socket.io + Leaflet maps
- **Driver-Friendly Revenue**: Drivers keep 100% of fares, platform monetizes via SaaS fees and booking fees

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Real-Time**: Socket.io
- **Maps**: Leaflet.js + OpenStreetMap

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials (optional for email/password only)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/transport_saas"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Seed the database with test data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open http://localhost:3000

### Test Accounts

After seeding, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Driver | driver@example.com | driver123 |
| Passenger | passenger@example.com | passenger123 |

## Monetization Model

**Zero-cost for drivers**: Individual drivers pay nothing and keep 100% of their fares.

**Revenue streams**:
1. **SaaS Subscription**: Transport companies pay R500-1500/month per vehicle for fleet management tools
2. **Booking Fee**: Passengers pay R5-10 platform fee per trip (shown transparently)
3. **Driver Premium**: Optional R200/month for verified badge and priority matching

**Example revenue**: A small company with 5 vehicles generates ~R14,500/month through SaaS fees and booking fees.

## Project Structure

```
transport-saas/
├── prisma/
│   ├── schema.prisma    # Database schema with all models
│   └── seed.ts          # Seed data for testing
├── src/
│   ├── app/
│   │   ├── actions/     # Server Actions for forms
│   │   ├── api/         # API routes (auth, socket.io)
│   │   ├── auth/        # Sign in, register pages
│   │   ├── admin/       # Admin dashboard
│   │   ├── driver/      # Driver dashboard
│   │   ├── passenger/   # Passenger dashboard
│   │   ├── layout.tsx   # Root layout with providers
│   │   └── page.tsx     # Landing page
│   ├── components/      # React components
│   ├── lib/
│   │   ├── auth.ts      # NextAuth configuration
│   │   └── db.ts        # Prisma client
│   └── types/
│       └── next-auth.d.ts # TypeScript extensions
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with test data

## Roadmap

See the full implementation plan at `.windsurf/plans/transport-saas-plan-8dd0f1.md`

### MVP Deliverables

1. ✅ Project scaffold with Next.js, TypeScript, Tailwind
2. ✅ Prisma schema with multi-tenancy
3. ✅ Authentication (NextAuth with Google + email/password)
4. 🔄 On-demand booking flow
5. 🔄 Scheduled/commuter booking flow
6. 🔄 Real-time GPS tracking
7. 🔄 EFT/Cash payment system
8. 🔄 Payment plans (weekly/monthly)
9. 🔄 Dashboards (Admin/Driver/Passenger)
10. 🔄 In-app messaging
11. 🔄 Multi-tenant middleware
12. 🔄 Full feature roadmap guide

### Post-MVP

- Stripe/PayFast integration
- Mobile app (React Native)
- Advanced analytics
- White-label customization
- POPIA compliance audit

## License

MIT
