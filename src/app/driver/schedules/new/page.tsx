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

export default function NewSchedulePage() {
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
    if (form.daysOfWeek.length === 0) { setError('Select at least one day'); return }
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
    if (result.success) router.push('/driver/schedules')
    else setError(result.error ?? 'Failed to create schedule')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/driver/schedules" className="text-gray-500 hover:text-gray-700">← Back</Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Schedule</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
          <input required className="input w-full" placeholder="e.g. Morning Commuter - Sandton to CBD"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea className="input w-full" rows={2} placeholder="Optional description"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📍 From (Pickup)</label>
            <input required className="input w-full" placeholder="Area or address"
              value={form.startLocationName} onChange={(e) => setForm({ ...form, startLocationName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🏁 To (Dropoff)</label>
            <input required className="input w-full" placeholder="Area or address"
              value={form.endLocationName} onChange={(e) => setForm({ ...form, endLocationName: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🕐 Departure Time</label>
            <input type="time" required className="input w-full"
              value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">💰 Price per Seat (R)</label>
            <input type="number" required min="1" step="0.50" className="input w-full" placeholder="e.g. 45.00"
              value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  form.daysOfWeek.includes(d.value)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📆 Effective From</label>
          <input type="date" required className="input w-full"
            value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Creating...' : '✅ Create Schedule'}
        </button>
      </form>
    </div>
  )
}
