'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/app/actions/reviews'

const categories = [
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'drivingSkill', label: 'Driving' },
  { key: 'communication', label: 'Communication' },
] as const

function StarPicker({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`text-2xl transition-transform hover:scale-110 ${
              star <= (hover || value) ? 'text-yellow-400' : 'text-gray-200'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ReviewForm({
  bookingId,
  driverId,
  driverName,
}: {
  bookingId: string
  driverId: string
  driverName: string
}) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [cats, setCats] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError('Please select an overall rating'); return }
    setLoading(true); setError('')
    const result = await submitReview({
      bookingId,
      driverId,
      rating,
      comment: comment.trim() || undefined,
      punctuality: cats.punctuality,
      cleanliness: cats.cleanliness,
      drivingSkill: cats.drivingSkill,
      communication: cats.communication,
    })
    setLoading(false)
    if (result.success) {
      setDone(true)
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to submit')
    }
  }

  if (done) {
    return (
      <div className="card text-center py-6">
        <p className="text-3xl mb-2">⭐</p>
        <p className="font-semibold text-gray-900">Review submitted! Thanks for your feedback.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <h3 className="font-semibold text-gray-900">Rate your trip with {driverName}</h3>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

      {/* Overall rating */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Overall Rating *</p>
        <StarPicker value={rating} onChange={setRating} label="" />
      </div>

      {/* Category ratings */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Category Ratings (optional)</p>
        {categories.map(({ key, label }) => (
          <StarPicker
            key={key}
            value={cats[key] ?? 0}
            onChange={(v) => setCats((prev) => ({ ...prev, [key]: v }))}
            label={label}
          />
        ))}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
        <textarea
          className="input w-full"
          rows={3}
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
