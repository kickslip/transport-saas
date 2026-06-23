'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSchedule } from '@/app/actions/driver'

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
]

export default function CustomSchedulePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    description: '',
    startLocationName: '',
    startLocationLat: '',
    startLocationLng: '',
    endLocationName: '',
    endLocationLat: '',
    endLocationLng: '',
    basePrice: '',
    startTime: '07:00',
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
    effectiveFrom: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day].sort(),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.daysOfWeek.length === 0) {
      setError('Select at least one day')
      return
    }
    setLoading(true)
    setError('')
    const result = await createSchedule({
      ...form,
      startLocationLat: parseFloat(form.startLocationLat) || -26.2041,
      startLocationLng: parseFloat(form.startLocationLng) || 28.0473,
      endLocationLat: parseFloat(form.endLocationLat) || -26.2041,
      endLocationLng: parseFloat(form.endLocationLng) || 28.0473,
      basePrice: Math.round(parseFloat(form.basePrice) * 100),
    })
    setLoading(false)
    if (result.success) {
      setDone(true)
      setTimeout(() => router.push('/passenger/book/scheduled'), 1200)
    } else {
      setError(result.error ?? 'Failed to create route')
    }
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-5xl mb-3">🚌</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Route Request Submitted</h1>
        <p className="text-sm text-gray-600 mb-6">
          Your custom route is pending. You can book it once a driver is assigned.
        </p>
        <Link href="/passenger/book/scheduled" className="btn-primary inline-block">
          Browse Routes
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/passenger/book/scheduled" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Request Custom Route</h1>
      </div>

      <p className="text-sm text-gray-600">
        Set up a recurring commute route. Other passengers can also book it once a driver is assigned.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
          <input
            required
            className="input w-full"
            placeholder="e.g. Work commute - Home to Office"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="input w-full"
            rows={2}
            placeholder="Why do you need this route? (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📍 From (Pickup)</label>
            <input
              required
              className="input w-full"
              placeholder="Area or address"
              value={form.startLocationName}
              onChange={(e) => setForm({ ...form, startLocationName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🏁 To (Dropoff)</label>
            <input
              required
              className="input w-full"
              placeholder="Area or address"
              value={form.endLocationName}
              onChange={(e) => setForm({ ...form, endLocationName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🕐 Departure Time</label>
            <input
              type="time"
              required
              className="input w-full"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">💰 Suggested Price/Seat (R)</label>
            <input
              type="number"
              required
              min="1"
              step="0.50"
              className="input w-full"
              placeholder="e.g. 45.00"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Days of Week</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.daysOfWeek.includes(d.value)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Select the days you need this route.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📆 Effective From</label>
          <input
            type="date"
            required
            className="input w-full"
            value={form.effectiveFrom}
            onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
          />
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">What happens next?</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-700">
            <li>Your route is listed as pending.</li>
            <li>Other passengers can express interest.</li>
            <li>Once a driver is assigned, bookings open.</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 text-lg min-h-[48px]"
        >
          {loading ? 'Submitting...' : 'Submit Custom Route'}
        </button>
      </form>
    </div>
  )
}
