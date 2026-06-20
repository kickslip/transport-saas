'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { bookScheduledTrip } from '@/app/actions/booking'

type PaymentMethod = 'EFT' | 'CASH' | 'WALLET'

export default function BookScheduleButton({
  scheduleId,
  basePrice,
  platformFee,
}: {
  scheduleId: string
  basePrice: number
  platformFee?: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [seats, setSeats] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const fee = platformFee ?? Math.round(basePrice * 0.07)
  const total = (basePrice + fee) * seats

  const handleBook = async () => {
    setLoading(true)
    const result = await bookScheduledTrip(scheduleId, seats)
    setLoading(false)
    if (result.success) {
      setDone(true)
      setTimeout(() => router.push('/passenger/trips'), 1500)
    } else {
      alert(result.error || 'Booking failed')
    }
  }

  if (done) return <p className="text-green-600 font-semibold text-sm mt-2">✅ Booked! Redirecting...</p>

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-sm mt-3 px-5 py-2">
        Book Now
      </button>
    )
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
      <h4 className="font-semibold text-gray-900 text-sm">Confirm Booking</h4>

      {/* Seats */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 w-24">Seats</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSeats(Math.max(1, seats - 1))}
            className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-200"
          >−</button>
          <span className="font-medium text-gray-900 w-4 text-center">{seats}</span>
          <button
            type="button"
            onClick={() => setSeats(Math.min(8, seats + 1))}
            className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-200"
          >+</button>
        </div>
      </div>

      {/* Payment method */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Payment Method</label>
        <div className="flex gap-2">
          {(['CASH', 'EFT', 'WALLET'] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                method === m
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {m === 'CASH' ? '💵 Cash' : m === 'EFT' ? '🏦 EFT' : '👛 Wallet'}
            </button>
          ))}
        </div>
        {method === 'EFT' && (
          <p className="text-xs text-gray-400 mt-1">You'll upload proof of payment from your Wallet page after booking.</p>
        )}
        {method === 'WALLET' && (
          <p className="text-xs text-gray-400 mt-1">Deducted from your wallet balance on trip completion.</p>
        )}
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-lg p-3 text-sm space-y-1 border border-gray-100">
        <div className="flex justify-between text-gray-500">
          <span>Base fare × {seats}</span>
          <span>R{(basePrice * seats / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Platform fee (7%)</span>
          <span>R{(fee * seats / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 border-t pt-1 mt-1">
          <span>Total</span>
          <span>R{(total / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleBook}
          disabled={loading}
          className="btn-primary flex-1 text-sm py-2"
        >
          {loading ? 'Confirming...' : `Confirm & Pay ${method === 'CASH' ? 'on pickup' : ''}`}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
