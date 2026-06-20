'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateMonthlyInvoice } from '@/app/actions/admin'

export default function GenerateInvoiceButton({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!confirm(`Generate invoice for ${tenantName} for this month?`)) return
    setLoading(true)
    const result = await generateMonthlyInvoice(tenantId)
    setLoading(false)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-xs font-medium px-3 py-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
    >
      {loading ? '...' : '+ Generate'}
    </button>
  )
}
