'use client'

import { useRouter } from 'next/navigation'
import { toggleTenantStatus } from '@/app/actions/admin'

export default function TenantToggle({ tenantId, isActive }: { tenantId: string; isActive: boolean }) {
  const router = useRouter()
  const handle = async () => {
    await toggleTenantStatus(tenantId, !isActive)
    router.refresh()
  }
  return (
    <button onClick={handle} className={`text-xs font-medium px-3 py-1 rounded-lg ${isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
      {isActive ? 'Suspend' : 'Activate'}
    </button>
  )
}
