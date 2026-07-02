import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, passengerId: session.user.id },
    include: {
      trip: {
        include: {
          driver: { select: { firstName: true, lastName: true, phoneNumber: true } },
          vehicle: { select: { make: true, model: true, registrationNumber: true } },
        },
      },
      tenant: { select: { name: true, contactEmail: true } },
      payments: { where: { status: 'COMPLETED' }, take: 1 },
      passenger: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  if (!booking) notFound()

  const payment = booking.payments[0]

  return (
    <div className="max-w-lg mx-auto">
      {/* Print button – hidden in print */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Link href={`/passenger/trips/${params.id}`} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Back to trip
        </Link>
        <button onClick={() => window.print()} className="btn-primary text-sm px-4 py-2">
          🖨️ Print
        </button>
      </div>

      {/* Receipt */}
      <div className="card space-y-5 print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{booking.tenant.name}</p>
          <h1 className="text-2xl font-bold text-gray-900">Trip Receipt</h1>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Booking info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs">Booking ID</p>
            <p className="font-mono text-gray-700">{booking.id.slice(0, 12).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Status</p>
            <p className="font-medium text-gray-700">{booking.status.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Passenger</p>
            <p className="font-medium text-gray-900">{booking.passenger.firstName} {booking.passenger.lastName}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Driver</p>
            <p className="font-medium text-gray-900">
              {booking.trip.driver ? `${booking.trip.driver.firstName} ${booking.trip.driver.lastName}` : 'Unassigned'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">From</p>
            <p className="font-medium text-gray-900">{booking.trip.startLocationName}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">To</p>
            <p className="font-medium text-gray-900">{booking.trip.endLocationName}</p>
          </div>
          {booking.trip.vehicle && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs">Vehicle</p>
              <p className="font-medium text-gray-900">
                {booking.trip.vehicle.make} {booking.trip.vehicle.model} · {booking.trip.vehicle.registrationNumber}
              </p>
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Base fare</span>
            <span>R{(booking.basePrice / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Platform fee</span>
            <span>R{(booking.platformFee / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t pt-2 text-base">
            <span>Total</span>
            <span>R{(booking.totalPrice / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment */}
        {payment && (
          <div className="bg-green-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-green-800">✓ Payment received</p>
            <p className="text-green-700 text-xs mt-0.5">
              {payment.method} · Ref: {payment.reference ?? 'N/A'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t pt-4">
          <p>{booking.tenant.name} · {booking.tenant.contactEmail}</p>
          <p className="mt-1">Thank you for riding with us!</p>
        </div>
      </div>
    </div>
  )
}
