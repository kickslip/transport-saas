'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleUserStatus, assignUserTenant } from '@/app/actions/admin'

type Tenant = { id: string; name: string }

export default function UserActions({
  userId,
  isActive,
  tenants,
  currentTenantId,
}: {
  userId: string
  isActive: boolean
  tenants: Tenant[]
  currentTenantId: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    await toggleUserStatus(userId, !isActive)
    setLoading(false)
    router.refresh()
  }

  const handleTenant = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await assignUserTenant(userId, e.target.value)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentTenantId ?? ''}
        onChange={handleTenant}
        className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-600"
      >
        <option value="">No tenant</option>
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`text-xs font-medium px-2 py-0.5 rounded ${isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
      >
        {isActive ? 'Suspend' : 'Activate'}
      </button>
    </div>
  )
}
