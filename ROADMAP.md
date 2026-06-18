# Transport SaaS - Full Feature Roadmap

This document outlines all required steps and features for the complete Transport SaaS application implementation.

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
- [ ] Run initial migration
- [ ] Create seed data for testing

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
- [ ] Test authentication flows

### 1.4 Database Connection ✓
- [x] Setup Prisma client singleton
- [x] Create database utility file
- [ ] Configure environment variables
- [ ] Test database connection

---

## Phase 2: Core Booking Flow (Days 4-8)

### 2.1 On-Demand Ride Flow

#### Passenger Journey:
- [ ] Create ride request form
  - [ ] Pickup location selection (with map)
  - [ ] Dropoff location selection
  - [ ] Vehicle type preference
  - [ ] Price estimate display
- [ ] Implement "Request Ride" Server Action
- [ ] Create passenger waiting screen
  - [ ] Show nearby drivers count
  - [ ] Estimated time to match
- [ ] Real-time driver assignment
  - [ ] Socket.io integration for live updates
  - [ ] Driver info display (name, photo, rating, vehicle)
  - [ ] Show driver approaching on map
- [ ] In-trip experience
  - [ ] Live GPS tracking on map
  - [ ] Share trip status with contacts
  - [ ] Emergency button
- [ ] Post-trip
  - [ ] Payment processing
  - [ ] Rating and review
  - [ ] Receipt generation

#### Driver Journey:
- [ ] Online/offline toggle
  - [ ] Geolocation tracking
  - [ ] Socket.io driver status broadcast
- [ ] Trip request notification
  - [ ] Accept/decline interface
  - [ ] Show pickup distance and direction
- [ ] Navigation to pickup
  - [ ] Integration with map directions
- [ ] Start/end trip flow
  - [ ] Passenger confirmation
  - [ ] Trip completion trigger

### 2.2 Scheduled/Commuter Flow

#### Passenger Journey:
- [ ] Browse available routes/schedules
  - [ ] Filter by date, time, location
  - [ ] Show available seats
  - [ ] Show price and recurrence pattern
- [ ] Subscribe to recurring trip
  - [ ] Select days of week
  - [ ] Choose pickup point
  - [ ] Select payment plan (weekly/monthly)
- [ ] Calendar view of upcoming trips
  - [ ] Trip reminders (24h, 1h before)
- [ ] Track assigned driver
  - [ ] Driver location before arrival
  - [ ] ETA updates

#### Driver Journey:
- [ ] Create schedule interface
  - [ ] Set route (start/end locations)
  - [ ] Set capacity
  - [ ] Set base price
  - [ ] Set recurrence pattern
- [ ] Manage schedules
  - [ ] View passenger list
  - [ ] Mark attendance
  - [ ] Cancel/modify schedules
- [ ] Daily manifest view
  - [ ] Passenger contact info
  - [ ] Pickup locations on map

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
- [ ] Client-side Socket.io integration
- [ ] GPS update interval configuration (5 seconds)
- [ ] Fallback to polling for low-connectivity
- [ ] WebSocket authentication with JWT

---

## Phase 3: Payments & Plans (Days 9-12)

### 3.1 MVP Payment Architecture (EFT + Cash) ✓

#### Payment Methods:
- [x] Define payment method enum (EFT, CASH)
- [ ] EFT flow:
  - [ ] Proof of payment upload (screenshot/PDF)
  - [ ] Admin verification dashboard
  - [ ] Mark as verified/rejected
  - [ ] Notifications to user
- [ ] Cash flow:
  - [ ] Driver marks payment as collected
  - [ ] Passenger confirmation
  - [ ] Receipt generation

#### Manual Reconciliation:
- [ ] Admin dashboard for verifying EFT uploads
- [ ] Driver cash collection tracking
- [ ] Outstanding payment reports per tenant
- [ ] Payment reminder system

### 3.2 Payment Plan Engine ✓
- [x] Define payment plan schema
  - [x] Plan types (PER_TRIP, COMMUTER_PASS, INSTALLMENT, PREPAID_WALLET)
  - [x] Frequency (ONE_TIME, DAILY, WEEKLY, MONTHLY)
  - [x] Installment count for split payments
- [ ] Create payment plan workflow
  - [ ] Passenger selects plan during booking
  - [ ] Calculate payment schedule
  - [ ] Store agreement details
- [ ] Automated payment scheduling
  - [ ] Cron job/Edge Function for due payments
  - [ ] Reminder notifications
  - [ ] Auto-create payment records

### 3.3 Wallet System
- [ ] Wallet balance per user
- [ ] Top-up options (EFT proof upload)
- [ ] Deduct from wallet for trips
- [ ] Transaction history
- [ ] Wallet payment method integration

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
- [ ] Tenant management
  - [ ] List all tenants
  - [ ] Create new tenant
  - [ ] Edit tenant settings
  - [ ] View tenant details
- [ ] User management
  - [ ] List all users with filters
  - [ ] Approve/reject driver applications
  - [ ] View user details
  - [ ] Deactivate accounts
- [ ] Vehicle management
  - [ ] Fleet overview
  - [ ] Add/edit vehicles
  - [ ] Assign vehicles to drivers
- [ ] Trip management
  - [ ] View all trips
  - [ ] Cancel/dispute resolution
  - [ ] Trip history
- [ ] Booking management
  - [ ] Pending bookings
  - [ ] Booking history
- [ ] Payment management
  - [ ] Verify EFT uploads
  - [ ] View all payments
  - [ ] Refund processing
- [ ] Invoice management
  - [ ] Generate monthly invoices
  - [ ] Track payment status
  - [ ] Send reminders
- [ ] Analytics & Reports
  - [ ] Revenue by tenant
  - [ ] Trip volume trends
  - [ ] Driver performance
  - [ ] Passenger retention

### 4.2 Driver Dashboard ✓
- [x] Layout with sidebar navigation
- [x] Dashboard overview ✓
  - [x] Online/offline toggle
  - [x] Current location display
  - [x] Quick stats (earnings, trips, rating)
- [ ] Trip management
  - [ ] Current/pending trips
  - [ ] Trip history
  - [ ] Accept on-demand requests
- [ ] Schedule management
  - [ ] Create recurring schedules
  - [ ] View assigned schedules
  - [ ] Manage passenger manifests
- [ ] Earnings tracker
  - [ ] Daily/weekly/monthly earnings
  - [ ] Payment history
  - [ ] Outstanding payments
- [ ] Messages
  - [ ] Chat with passengers
  - [ ] Message history per trip
- [ ] Profile management
  - [ ] Update personal info
  - [ ] Upload documents (license, vehicle papers)
  - [ ] View ratings and reviews
  - [ ] Upgrade to premium tier

### 4.3 Passenger Dashboard
- [ ] Layout with sidebar navigation
- [ ] Dashboard overview
  - [ ] Quick actions (book trip, view schedules)
  - [ ] Upcoming trips
  - [ ] Wallet balance
- [ ] Book a trip
  - [ ] On-demand booking form
  - [ ] Scheduled trip browser
  - [ ] Route subscription
- [ ] My trips
  - [ ] Upcoming trips calendar
  - [ ] Trip history
  - [ ] Rebook previous trips
- [ ] Track driver
  - [ ] Live map view
  - [ ] Driver location and ETA
  - [ ] Contact driver
- [ ] Payment management
  - [ ] Payment methods
  - [ ] Payment plans
  - [ ] Payment history
  - [ ] Upload EFT proof
- [ ] Messages
  - [ ] Chat with drivers
- [ ] Profile settings
  - [ ] Personal info
  - [ ] Saved locations
  - [ ] Notification preferences

---

## Phase 5: Messaging & Notifications (Days 17-19)

### 5.1 In-App Messaging
- [x] Socket.io room per trip_id
- [ ] Message persistence in PostgreSQL
- [ ] Chat interface component
- [ ] Message types:
  - [ ] Text messages
  - [ ] Template messages ("I'm here", "Running late", "Arrived")
  - [ ] System messages (trip updates)
- [ ] Unread message indicators
- [ ] Message history per trip
- [ ] Real-time message delivery

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
- [ ] Prisma middleware for tenant filtering
- [ ] Subdomain routing (tenant.domain.com)
- [ ] Tenant context provider
- [ ] Admin invitation system for new tenants

### 6.2 Branding Customization
- [x] Tenant-specific fields in schema
  - [x] Logo URL
  - [x] Primary color
  - [x] Company name
- [ ] Dynamic theme application
- [ ] White-label capabilities
- [ ] Custom domain support

### 6.3 Compliance (POPIA)
- [x] Consent tracking in schema
- [ ] Data retention policy implementation
- [ ] Right to deletion workflow
- [ ] Audit logging for all sensitive operations
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
- [ ] Vercel configuration
- [ ] Environment variable management
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
- [ ] Users can register as passengers or drivers
- [ ] Passengers can book both on-demand and scheduled trips
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
