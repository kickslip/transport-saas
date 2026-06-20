'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTenantAdmin } from '@/app/actions/admin'

export default function NewTenantPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', slug: '', contactEmail: '', contactPhone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const slugify = (v: string) => v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const result = await createTenantAdmin(form)
    setLoading(false)
    if (result.success) router.push('/admin/tenants')
    else setError(result.error ?? 'Failed')
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants" className="text-gray-500 hover:text-gray-700">← Back</Link>
        <h1 className="text-2xl font-bold text-gray-900">New Tenant</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input required className="input w-full" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <input required className="input w-full font-mono" value={form.slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          <p className="text-xs text-gray-400 mt-1">Used in URLs. Auto-generated from name.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
          <input type="email" required className="input w-full" value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
          <input type="tel" className="input w-full" value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea className="input w-full" rows={2} value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating...' : 'Create Tenant'}
        </button>
      </form>
    </div>
  )
}
