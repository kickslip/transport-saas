'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { upgradeToPremium } from '@/app/actions/driverPremium'

export default function DriverPremiumPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpgrade = async () => {
    if (!confirm('Upgrade to Premium for R200/month? This will be deducted from your wallet.')) return
    setLoading(true)
    setMessage('')
    const result = await upgradeToPremium()
    setLoading(false)
    if (result.success) {
      setMessage('✅ Upgraded to Premium!')
      setTimeout(() => router.push('/driver'), 1200)
    } else {
      setMessage(result.error ?? 'Upgrade failed')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/driver" className="text-gray-500 hover:text-gray-700">← Dashboard</Link>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Driver Premium</h1>
      </div>

      <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⭐</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Premium Driver</h2>
            <p className="text-sm text-gray-600">R200/month · Verified badge · Priority matching</p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-gray-700 mb-6">
          <li className="flex items-center gap-2">✅ Verified badge on passenger app</li>
          <li className="flex items-center gap-2">✅ Priority matching for on-demand requests</li>
          <li className="flex items-center gap-2">✅ Highlighted profile in driver listings</li>
          <li className="flex items-center gap-2">✅ Access to premium support</li>
        </ul>

        {message && (
          <p className={`text-sm mb-4 ${message.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="btn-primary w-full py-3 text-lg"
        >
          {loading ? 'Processing...' : 'Upgrade to Premium — R200/month'}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Deducted from your wallet balance. Top up via EFT if needed.
        </p>
      </div>
    </div>
  )
}
