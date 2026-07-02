'use client'

import { useState } from 'react'
import { updateTenantBilling } from '@/app/actions/tenantBilling'
import { BillingCycle } from '@/generated/prisma/enums'

type Billing = {
  id: string
  tenantId: string
  billingDay: number
  billingCycle: BillingCycle
  bookingFeePercent: number
  saasFeePerVehicle: number
}

type Props = {
  tenantId: string
  name: string
  billing: Billing | null
}

export default function TenantBillingForm({ tenantId, name, billing }: Props) {
  const [form, setForm] = useState({
    bookingFeePercent: billing?.bookingFeePercent ?? 7,
    saasFeePerVehicle: billing?.saasFeePerVehicle ?? 20000,
    billingDay: billing?.billingDay ?? 1,
    billingCycle: billing?.billingCycle ?? 'MONTHLY' as BillingCycle,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const result = await updateTenantBilling({
      tenantId,
      bookingFeePercent: form.bookingFeePercent,
      saasFeePerVehicle: form.saasFeePerVehicle,
      billingDay: form.billingDay,
      billingCycle: form.billingCycle,
    })
    setSaving(false)
    setMessage(result.success ? '✅ Saved' : (result.error ?? 'Failed'))
  }

  return (
    <form onSubmit={handleSubmit} className="py-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          {message && (
            <p className={`text-xs mt-1 ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Booking Fee %</label>
            <input
              type="number"
              min={0}
              max={50}
              className="input w-24"
              value={form.bookingFeePercent}
              onChange={(e) => setForm({ ...form, bookingFeePercent: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">SaaS Fee (cents)</label>
            <input
              type="number"
              min={0}
              step={1}
              className="input w-28"
              value={form.saasFeePerVehicle}
              onChange={(e) => setForm({ ...form, saasFeePerVehicle: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Billing Day</label>
            <input
              type="number"
              min={1}
              max={28}
              className="input w-20"
              value={form.billingDay}
              onChange={(e) => setForm({ ...form, billingDay: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cycle</label>
            <select
              className="input w-28"
              value={form.billingCycle}
              onChange={(e) => setForm({ ...form, billingCycle: e.target.value as BillingCycle })}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary text-sm px-4 py-2 self-start"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
