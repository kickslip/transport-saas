'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function EftUploadForm({ userId }: { userId: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setResult({ type: 'error', msg: 'Please select a file' }); return }
    if (!amount || parseFloat(amount) <= 0) { setResult({ type: 'error', msg: 'Enter a valid amount' }); return }

    setLoading(true); setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('amount', amount)

    try {
      const res = await fetch('/api/upload/proof', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setResult({ type: 'success', msg: 'Proof submitted! Wallet will be credited within 2–4 hours after admin verification.' })
        setAmount('')
        setFile(null)
        if (fileRef.current) fileRef.current.value = ''
        router.refresh()
      } else {
        setResult({ type: 'error', msg: data.error ?? 'Upload failed' })
      }
    } catch {
      setResult({ type: 'error', msg: 'Network error. Please try again.' })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 space-y-1">
        <p><strong>Bank:</strong> First National Bank</p>
        <p><strong>Account:</strong> 123 456 789</p>
        <p><strong>Branch:</strong> 250 655</p>
        <p><strong>Reference:</strong> {userId.slice(0, 8).toUpperCase()}</p>
      </div>

      {result && (
        <div className={`rounded-lg p-3 text-sm ${result.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {result.msg}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (ZAR) *</label>
        <input
          type="number"
          min="10"
          step="0.01"
          required
          className="input w-full"
          placeholder="e.g. 250.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Proof of Payment (JPG, PNG or PDF, max 5MB) *
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
        {file && (
          <p className="text-xs text-gray-400 mt-1">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
        )}
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Uploading...' : 'Submit Proof of Payment'}
      </button>
    </form>
  )
}
