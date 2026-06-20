import { auth } from '@/lib/auth'
import { getDriverReviews } from '@/app/actions/reviews'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default async function DriverReviewsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const reviews = await getDriverReviews(session.user.id)

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>

      {/* Summary */}
      <div className="card flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-yellow-500">{avgRating ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">Average rating</p>
        </div>
        <div className="w-px h-12 bg-gray-200" />
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">{reviews.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total reviews</p>
        </div>
        {avgRating && (
          <>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <Stars rating={Math.round(parseFloat(avgRating))} />
            </div>
          </>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">⭐</p>
          <p>No reviews yet. Complete trips to receive passenger feedback.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <Stars rating={r.rating} />
                  <p className="text-xs text-gray-400 mt-0.5">
                    by {r.reviewer.firstName} {r.reviewer.lastName} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {/* Category scores */}
                <div className="text-xs text-gray-500 space-y-0.5 text-right">
                  {r.punctuality && <p>Punctuality: {r.punctuality}/5</p>}
                  {r.cleanliness && <p>Cleanliness: {r.cleanliness}/5</p>}
                  {r.drivingSkill && <p>Driving: {r.drivingSkill}/5</p>}
                  {r.communication && <p>Communication: {r.communication}/5</p>}
                </div>
              </div>
              {r.comment && <p className="text-sm text-gray-700 border-t pt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
