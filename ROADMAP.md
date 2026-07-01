# WanToe - Full Feature Roadmap

This document outlines all required steps and features for the complete WanToe application implementation.

## Table of Contents

1. [Phase 1: Foundation](#phase-1-foundation-days-1-3)
2. [Phase 2: Core Booking Flow](#phase-2-core-booking-flow-days-4-8)
3. [Phase 3: Payments & Plans](#phase-3-payments--plans-days-9-12)
4. [Phase 4: Dashboards](#phase-4-dashboards-days-13-16)
5. [Phase 5: Messaging & Notifications](#phase-5-messaging--notifications-days-17-19)
6. [Phase 6: Multi-Tenancy & Branding](#phase-6-multi-tenancy--branding-days-20-22)
7. [Phase 7: Testing & Deployment](#phase-7-testing--deployment-days-23-25)
8. [Phase 8: Future Payment Gateways](#phase-8-future-payment-gateways-post-mvp)

---

## Phase 1: Foundation (Days 1-3)

### 1.1 Project Scaffold ✓
- [x] Initialize Next.js 14 with App Router, TypeScript, Tailwind CSS
- [x] Setup project structure (src/app, src/components, src/lib, src/types)
- [x] Configure tsconfig.json with path aliases
- [x] Setup next.config.js with Server Actions enabled
- [x] Configure Tailwind CSS with custom color scheme
- [x] Create globals.css with custom components

### 1.2 Database Schema (Prisma) ✓
- [x] Define Prisma schema with all models:
  - [x] Tenant (multi-tenancy)
  - [x] User (with roles: ADMIN, DRIVER, PASSENGER)
  - [x] Vehicle (fleet management)
  - [x] Trip (on-demand + scheduled)
  - [x] TripSchedule (recurring commuter routes)
  - [x] Booking (reservations)
  - [x] TripLocation (GPS tracking)
  - [x] Payment (transactions)
  - [x] PaymentPlan (installments/subscriptions)
  - [x] Message (chat)
  - [x] Review (ratings)
  - [x] Invoice (SaaS billing)
  - [x] TenantBilling (billing settings)
  - [x] AuditLog (POPIA compliance)
- [x] Setup enums for type safety
- [x] Create database indexes for performance
- [x] Run initial migration
- [x] Create seed data for testing

### 1.3 Authentication ✓
- [x] Configure NextAuth.js with:
  - [x] Google OAuth provider
  - [x] Credentials provider (email/password)
  - [x] JWT session strategy
  - [x] Role-based session handling
  - [x] TypeScript type declarations
- [x] Create sign-in page
- [x] Create registration page
- [x] Create Server Actions for auth
- [x] Test authentication flows

### 1.4 Database Connection ✓
- [x] Setup Prisma client singleton
- [x] Create database utility file
- [x] Configure environment variables
- [x] Test database connection

---

## Phase 2: Core Booking Flow (Days 4-8)

### 2.1 On-Demand Ride Flow

#### Passenger Journey:
- [x] Create ride request form
  - [x] Pickup location input
  - [x] Dropoff location input
  - [x] Vehicle type preference
  - [x] Price estimate display
- [x] Implement "Request Ride" Server Action (stub — real dispatch via Socket.io)
- [x] Create passenger waiting screen
  - [x] Show nearby drivers count
  - [x] Estimated time to match (elapsed timer)
- [x] Real-time driver assignment
  - [x] Socket.io client integration
  - [x] Driver info display (name, phone on trip detail)
  - [x] Show driver on OpenStreetMap via Leaflet (LiveMap component)
- [x] In-trip experience
  - [x] Live GPS tracking on map (LiveMap + TripTracker)
  - [ ] Emergency button
- [x] Post-trip
  - [x] Rating and review (star picker, category ratings, comment)
  - [x] Receipt generation (printable /passenger/trips/[id]/receipt)

#### Driver Journey:
- [x] Online/offline toggle (server action ready)
  - [ ] Geolocation tracking *(Socket.io client needed)*
  - [ ] Socket.io driver status broadcast *(in progress)*
- [ ] Trip request notification
  - [ ] Accept/decline interface
- [x] Start/end trip flow
  - [x] Trip start action (status → IN_PROGRESS, time recorded)
  - [x] Trip complete action (status → COMPLETED, time recorded)
  - [ ] Passenger confirmation

### 2.2 Scheduled/Commuter Flow

#### Passenger Journey:
- [x] Browse available routes/schedules
  - [x] Show price and recurrence pattern
  - [x] Filter by search + day of week
  - [x] Show available seats
- [x] Book scheduled trip (Server Action)
- [ ] Calendar view of upcoming trips
- [ ] Track assigned driver (requires Socket.io)

#### Driver Journey:
- [x] Create schedule interface
  - [x] Set route (start/end locations)
  - [x] Set base price
  - [x] Set recurrence pattern (days of week, time)
- [x] View own schedules list
- [x] View passenger manifest per schedule (/driver/schedules/[id]/manifest)
- [x] Mark attendance (AttendanceToggle component)

### 2.3 Real-Time Infrastructure
- [x] Setup Socket.io server
  - [x] Connection handling
  - [x] Room management per trip
  - [x] Event handlers for:
    - [x] join-trip
    - [x] leave-trip
    - [x] driver-location
    - [x] driver-status
    - [x] send-message
    - [x] trip-request
    - [x] accept-trip
- [x] Client-side Socket.io hook (`useSocket`)
- [x] GPS watchPosition with 5-second updates via `navigator.geolocation`
- [x] Driver live panel (online/offline toggle + GPS broadcast + trip requests)
- [x] Passenger trip tracker (joins trip room, receives live location)
- [ ] Fallback to polling for low-connectivity
- [ ] WebSocket authentication with JWT

---

## Phase 3: Payments & Plans (Days 9-12)

### 3.1 MVP Payment Architecture (EFT + Cash) ✓

#### Payment Methods:
- [x] Define payment method enum (EFT, CASH)
- [x] EFT flow:
  - [x] Proof of payment upload (screenshot/PDF, max 5MB)
  - [x] Admin verification dashboard
  - [x] Mark as verified/rejected
  - [ ] Notifications to user
- [x] Cash flow:
  - [x] Driver marks payment as collected (CashCollectButton)
  - [ ] Passenger confirmation
  - [x] Receipt generation (printable receipt page)

#### Manual Reconciliation:
- [x] Admin dashboard for verifying EFT uploads
- [x] Driver cash collection tracking (collectCash server action)
- [x] Outstanding payment reports (driver/earnings/outstanding)
- [ ] Payment reminder system

### 3.2 Payment Plan Engine ✓
- [x] Define payment plan schema
  - [x] Plan types (PER_TRIP, COMMUTER_PASS, INSTALLMENT, PREPAID_WALLET)
  - [x] Frequency (ONE_TIME, DAILY, WEEKLY, MONTHLY)
  - [x] Installment count for split payments
- [x] Create payment plan workflow
  - [x] Passenger selects payment method during booking (BookScheduleButton modal)
  - [x] Price breakdown display (base + platform fee × seats)
  - [ ] Full installment/subscription plan engine
- [ ] Automated payment scheduling
  - [ ] Cron job/Edge Function for due payments
  - [ ] Reminder notifications
  - [ ] Auto-create payment records

### 3.3 Wallet System
- [x] Wallet UI (balance display, EFT bank details, file upload)
- [x] Transaction history display
- [x] Real wallet balance computed from verified EFT payments
- [x] EFT proof upload (POST /api/upload/proof → saves to public/uploads/proofs)
- [x] Admin payment verification with proof link
- [ ] Deduct from wallet for trips
- [ ] Cloud file storage (S3/Cloudinary)

### 3.4 Passenger Booking Fee (Monetization)
- [ ] Add platform fee to checkout
- [ ] Display transparently to passenger
- [ ] Configure fee amount in tenant settings
- [ ] Track revenue per tenant

---

## Phase 4: Dashboards (Days 13-16)

### 4.1 Admin Dashboard ✓
- [x] Layout with sidebar navigation
- [x] Dashboard overview page
  - [x] Stats cards (tenants, drivers, passengers, vehicles)
  - [x] Recent trips table
  - [ ] Revenue charts
- [x] Tenant management
  - [x] List all tenants
  - [x] Create new tenant
  - [x] Suspend/activate tenants
  - [x] Edit tenant settings (/admin/tenants/[id]/edit)
- [x] User management
  - [x] List all users with filters (role, search)
  - [x] Deactivate/activate accounts
  - [x] Assign users to tenants
- [x] Vehicle management
  - [x] Fleet overview
- [x] Trip management
  - [x] View all trips with filters
- [x] Booking management
  - [x] View all bookings with status filter
- [x] Payment management
  - [x] Verify EFT payments
  - [x] Reject payments
  - [x] View all payments
- [x] Invoice management
  - [x] View invoice list
  - [x] Generate monthly invoices (GenerateInvoiceButton, generateMonthlyInvoice action)
  - [ ] Send reminders
- [x] Settings page (platform fees, billing)
- [x] Analytics & Reports
  - [x] Monthly revenue bar chart
  - [x] Booking status breakdown
  - [x] Top tenants by activity
  - [x] KPI cards (total revenue, bookings, completion rate)

### 4.2 Driver Dashboard ✓
- [x] Layout with sidebar navigation
- [x] Dashboard overview ✓
  - [x] Online/offline toggle
  - [x] Current location display
  - [x] Quick stats (earnings, trips, rating)
- [x] Trip management
  - [x] Current/pending trips
  - [x] Trip history
  - [ ] Accept on-demand requests (requires Socket.io)
- [x] Schedule management
  - [x] Create recurring schedules
  - [x] View assigned schedules
  - [x] Manage passenger manifests (/driver/schedules/[id]/manifest)
- [x] Earnings tracker
  - [x] Total/monthly earnings
  - [x] Payment history
  - [x] Outstanding payments (/driver/earnings/outstanding)
- [x] Messages
  - [x] Chat with passengers (TripChat in trip detail)
  - [x] Message history per trip (/driver/messages inbox)
- [x] Profile management
  - [x] Update personal info
  - [ ] Upload documents (license, vehicle papers)
  - [x] View ratings and reviews (/driver/reviews)
  - [ ] Upgrade to premium tier

### 4.3 Passenger Dashboard
- [x] Layout with sidebar navigation
- [x] Dashboard overview
  - [x] Quick actions (book trip, view schedules)
  - [x] Upcoming trips (real data from DB)
  - [x] Wallet balance (placeholder)
- [x] Book a trip
  - [x] On-demand booking form
  - [x] Scheduled trip browser
  - [x] Route subscription (book scheduled route)
- [x] My trips
  - [x] Upcoming trips list
  - [x] Trip history
  - [x] Cancel booking
- [ ] Track driver
  - [ ] Live map view
  - [ ] Driver location and ETA
  - [ ] Contact driver
- [x] Payment management
  - [x] Payment history
  - [x] Upload EFT proof (UI ready, backend pending)
- [ ] Messages
  - [ ] Chat with drivers
- [x] Profile settings
  - [x] Personal info (edit name, phone)

---

## Phase 5: Messaging & Notifications (Days 17-19)

### 5.1 In-App Messaging
- [x] Socket.io room per trip_id
- [x] Message persistence in PostgreSQL (sendMessage server action)
- [x] Chat interface component (TripChat with real-time + DB persistence)
- [x] Trip detail page with live tracking + chat
- [x] Message types:
  - [x] Text messages
  - [x] Template messages ("I'm on my way", "Running 5 min late", "I've arrived", "On my way to you")
  - [ ] System messages (trip updates)
- [ ] Unread message indicators
- [x] Message history per trip (driver/passenger messages inbox)
- [x] Real-time message delivery (Socket.io + DB persist)

### 5.2 Push Notifications
- [ ] Web Push API setup
- [ ] Notification triggers:
  - [ ] Driver assigned
  - [ ] Driver approaching
  - [ ] Trip starting
  - [ ] Trip completed
  - [ ] Payment due
  - [ ] New message received
  - [ ] Schedule reminder (24h, 1h before)
- [ ] Notification preferences per user
- [ ] Browser notification permissions

---

## Phase 6: Multi-Tenancy & Branding (Days 20-22)

### 6.1 Tenant Isolation
- [x] Row-level security with tenant_id
- [x] Prisma query extension for tenant filtering (tenantDb.ts helper)
- [ ] Subdomain routing (tenant.domain.com)
- [ ] Tenant context provider
- [ ] Admin invitation system for new tenants

### 6.2 Branding Customization
- [x] Tenant-specific fields in schema
  - [x] Logo URL
  - [x] Primary color
  - [x] Company name
- [x] Dynamic theme application (TenantThemeInjector CSS variable injection)
- [x] Edit tenant branding from admin (/admin/tenants/[id]/edit)
- [ ] White-label capabilities (subdomain routing)
- [ ] Custom domain support

### 6.3 Compliance (POPIA)
- [x] Consent tracking in schema
- [ ] Data retention policy implementation
- [ ] Right to deletion workflow
- [x] Audit logging for all sensitive operations (auditLog utility + /admin/audit page)
  - [x] Trip start/complete
  - [x] Payment verified/rejected
  - [x] Review submitted
- [ ] Privacy policy and terms acceptance
- [ ] Data export functionality

---

## Phase 7: Testing & Deployment (Days 23-25)

### 7.1 Testing
- [ ] Unit tests for Server Actions (Vitest)
- [ ] E2E tests for booking flows (Playwright)
  - [ ] Passenger booking flow
  - [ ] Driver acceptance flow
  - [ ] Payment processing flow
- [ ] Load testing for WebSocket connections
- [ ] Payment flow testing
- [ ] Mobile responsiveness testing

### 7.2 Deployment
- [x] Vercel configuration (vercel.json)
- [x] Environment variable management (.env.example)
- [ ] Database hosting setup (Neon/Supabase)
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Production monitoring
- [ ] Error tracking (Sentry)

---

## Phase 8: Future Payment Gateways (Post-MVP)

### 8.1 Stripe Integration
- [ ] Payment Intents for instant card payments
- [ ] Subscriptions for recurring commuter plans
- [ ] Stripe Connect for driver payouts (marketplace model)
- [ ] Webhook handling
- [ ] Refund processing

### 8.2 Regional Gateways
- [ ] PayFast integration (South Africa)
- [ ] Yoco integration (South Africa)
- [ ] Other regional providers as needed

---

## Monetization Implementation Checklist

### Tenant Billing System
- [ ] Monthly SaaS invoice generation
- [ ] Automated invoicing on billing day
- [ ] Invoice PDF generation
- [ ] Email notifications for new invoices
- [ ] Payment tracking and reconciliation
- [ ] Overdue invoice reminders
- [ ] Tenant billing settings UI

### Passenger Booking Fee
- [ ] Add booking fee calculation to checkout
- [ ] Display fee breakdown to passenger
- [ ] Store fee revenue per tenant
- [ ] Reporting dashboard for fee revenue

### Driver Freemium Tier
- [ ] Free tier: Basic access
- [ ] Premium tier (R200/month):
  - [ ] Verified badge
  - [ ] Priority matching
  - [ ] Advanced analytics
  - [ ] Premium support
- [ ] Upgrade/downgrade workflow
- [ ] Subscription management

---

## Architecture Summary

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-Time**: Socket.io
- **Maps**: Leaflet.js + OpenStreetMap

### Database Models
- 15+ tables covering all aspects of transport management
- Multi-tenant design with tenant_id isolation
- Comprehensive audit logging for compliance
- Soft deletes and data retention policies

### Key Features
- Dual transport models (on-demand + scheduled)
- Real-time GPS tracking
- In-app messaging
- Flexible payment options (EFT/Cash)
- Payment plans and subscriptions
- Multi-tenant SaaS architecture
- POPIA compliant data handling

---

## Success Metrics

### MVP Completion Criteria
- [x] Users can register as passengers or drivers
- [x] Passengers can book both on-demand and scheduled trips
- [ ] Drivers can accept trips and track GPS location
- [ ] EFT/Cash payments work end-to-end
- [ ] Admin can manage tenants and verify payments
- [ ] Real-time tracking displays on maps
- [ ] In-app messaging between drivers and passengers

### Post-MVP Goals
- [ ] Stripe integration for card payments
- [ ] Mobile app (React Native)
- [ ] 10+ active tenants
- [ ] 100+ daily trips
- [ ] R50,000+ monthly revenue

---

## Notes

- All features should be implemented with tenant isolation in mind
- Keep driver costs zero - monetize through SaaS fees and booking fees
- Prioritize mobile responsiveness for driver and passenger apps
- Maintain comprehensive audit logs for POPIA compliance
- Document all API endpoints and Server Actions
