'use client'

import { useState } from 'react'
import { updateDriverDocuments } from '@/app/actions/driverDocuments'

type Props = {
  licenseNumber?: string | null
  licenseExpiry?: Date | null
  licenseImageUrl?: string | null
}

export default function DriverDocumentUpload({ licenseNumber, licenseExpiry, licenseImageUrl }: Props) {
  const [form, setForm] = useState({
    driverLicenseNumber: licenseNumber ?? '',
    driverLicenseExpiry: licenseExpiry ? licenseExpiry.toISOString().split('T')[0] : '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setMessage('')

    let imageUrl = licenseImageUrl
    try {
      if (file) {
        const data = new FormData()
        data.append('file', file)
        data.append('docType', 'license')
        const res = await fetch('/api/upload/document', { method: 'POST', body: data })
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Upload failed')
        imageUrl = json.documentUrl
      }

      const result = await updateDriverDocuments({
        driverLicenseNumber: form.driverLicenseNumber,
        driverLicenseExpiry: form.driverLicenseExpiry,
        driverLicenseImageUrl: imageUrl ?? undefined,
      })

      setMessage(result.success ? '✅ Documents saved' : (result.error ?? 'Failed to save'))
    } catch (err: any) {
      setMessage(err?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="font-semibold text-gray-900">Driver Documents</h2>

      {message && (
        <p className={`text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Driver License Number</label>
        <input
          type="text"
          className="input w-full"
          value={form.driverLicenseNumber}
          onChange={(e) => setForm({ ...form, driverLicenseNumber: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
        <input
          type="date"
          className="input w-full"
          value={form.driverLicenseExpiry}
          onChange={(e) => setForm({ ...form, driverLicenseExpiry: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">License Document</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="block w-full text-sm text-gray-600"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP or PDF (max 5MB)</p>
        {licenseImageUrl && !file && (
          <a href={licenseImageUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline mt-1 inline-block">
            View current document →
          </a>
        )}
      </div>

      <button type="submit" disabled={uploading} className="btn-primary w-full">
        {uploading ? 'Saving...' : 'Save Documents'}
      </button>
    </form>
  )
}
