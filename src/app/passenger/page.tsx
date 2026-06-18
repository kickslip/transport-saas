'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PassengerDashboardPage() {
  const [bookingType, setBookingType] = useState<'on-demand' | 'scheduled'>('on-demand')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Passenger Dashboard</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Upcoming Trips</p>
          <p className="text-2xl font-bold text-primary-600">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Wallet Balance</p>
          <p className="text-2xl font-bold text-green-600">R0.00</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active Subscriptions</p>
          <p className="text-2xl font-bold text-primary-600">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Trips</p>
          <p className="text-2xl font-bold text-gray-700">0</p>
        </div>
      </div>

      {/* Book a Trip Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Book a Trip</h2>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setBookingType('on-demand')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              bookingType === 'on-demand'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🚗 On-Demand Ride
          </button>
          <button
            onClick={() => setBookingType('scheduled')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              bookingType === 'scheduled'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📅 Scheduled Route
          </button>
        </div>

        {bookingType === 'on-demand' ? (
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              Request a ride right now. A nearby driver will pick you up within minutes.
            </p>
            <Link href="/passenger/book/on-demand" className="btn-primary inline-block">
              Request Ride Now
            </Link>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              Subscribe to a recurring route for your daily commute. Save with weekly or monthly plans.
            </p>
            <Link href="/passenger/book/scheduled" className="btn-primary inline-block">
              Browse Routes
            </Link>
          </div>
        )}
      </div>

      {/* Upcoming Trips */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
          <Link href="/passenger/trips" className="text-primary-600 hover:text-primary-500 text-sm">
            View All →
          </Link>
        </div>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-4">No upcoming trips</p>
          <Link href="/passenger/book/on-demand" className="text-primary-600 hover:text-primary-500 mt-2 inline-block">
            Book your first trip →
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No recent trips</p>
        </div>
      </div>
    </div>
  )
}
