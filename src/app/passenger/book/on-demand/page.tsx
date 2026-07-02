'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSocket } from '@/hooks/useSocket'
import { useSession } from 'next-auth/react'
import { createOnDemandRequest } from '@/app/actions/trips'
import { getTenantBookingFeePercent } from '@/app/actions/tenantFees'

export default function OnDemandBookingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { emit } = useSocket()
  const [form, setForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    vehicleType: 'any',
    notes: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [bookingFeePercent, setBookingFeePercent] = useState(7)

  useEffect(() => {
    const tenantId = session?.user?.tenantId
    if (tenantId) {
      getTenantBookingFeePercent(tenantId).then(setBookingFeePercent)
    }
  }, [session?.user?.tenantId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const passengerId = session?.user?.id
      const tenantId = session?.user?.tenantId
      if (!passengerId || !tenantId) {
        setError('Please sign in to request a ride.')
        setIsLoading(false)
        return
      }

      const estimatedPrice = 5000 // R50 stub — real pricing from server action
      const platformFee = Math.round(estimatedPrice * (bookingFeePercent / 100))
      const result = await createOnDemandRequest({
        tenantId,
        passengerId,
        pickupName: form.pickupLocation,
        pickupLat: 0,
        pickupLng: 0,
        dropoffName: form.dropoffLocation,
        dropoffLat: 0,
        dropoffLng: 0,
        basePrice: estimatedPrice,
        platformFee,
        notes: form.notes,
      })

      if (!result.success || !result.trip) {
        setError(result.error || 'Failed to create ride request.')
        setIsLoading(false)
        return
      }

      const tripId = result.trip.id
      const bookingId = result.bookingId
      const requestId = `${passengerId}-${Date.now()}`
      emit('trip-request', {
        requestId,
        tripId,
        passengerId,
        pickup: { lat: 0, lng: 0, name: form.pickupLocation },
        dropoff: { lat: 0, lng: 0, name: form.dropoffLocation },
        price: estimatedPrice + platformFee,
      })
      const qs = new URLSearchParams({
        requestId,
        tripId,
        ...(bookingId && { bookingId }),
        pickup: form.pickupLocation,
        dropoff: form.dropoffLocation,
      })
      router.push(`/passenger/waiting?${qs}`)
    } catch {
      setError('Failed to request ride. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/passenger" className="text-gray-500 hover:text-gray-700">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Request On-Demand Ride</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📍 Pickup Location
            </label>
            <input
              type="text"
              required
              className="input w-full"
              placeholder="Enter your pickup address"
              value={form.pickupLocation}
              onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🏁 Drop-off Location
            </label>
            <input
              type="text"
              required
              className="input w-full"
              placeholder="Enter your destination"
              value={form.dropoffLocation}
              onChange={(e) => setForm({ ...form, dropoffLocation: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🚗 Vehicle Type
            </label>
            <select
              className="input w-full"
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            >
              <option value="any">Any Available</option>
              <option value="sedan">Sedan (1-4 passengers)</option>
              <option value="minivan">Minivan (5-8 passengers)</option>
              <option value="quantum">Quantum (up to 14 passengers)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📝 Notes (optional)
            </label>
            <textarea
              className="input w-full"
              rows={3}
              placeholder="Any special instructions for the driver?"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Price Estimate Box */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Base fare estimate</span>
              <span>R50.00</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Platform fee ({bookingFeePercent}%)</span>
              <span>R{((5000 * (bookingFeePercent / 100)) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-blue-200">
              <span>Estimated Total</span>
              <span>R{((5000 + 5000 * (bookingFeePercent / 100)) / 100).toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Final price confirmed after driver match</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-lg"
          >
            {isLoading ? 'Finding drivers...' : '🚗 Request Ride Now'}
          </button>
        </form>
      </div>

      <div className="card bg-yellow-50 border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 How it works</h3>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Submit your ride request</li>
          <li>Nearby drivers are notified</li>
          <li>Driver accepts and heads to your pickup</li>
          <li>Track driver location in real-time</li>
          <li>Pay on completion via EFT or cash</li>
        </ol>
      </div>
    </div>
  )
}
