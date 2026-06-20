'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function ScheduleFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [day, setDay] = useState(params.get('day') ?? '')

  const apply = () => {
    const qs = new URLSearchParams()
    if (search) qs.set('q', search)
    if (day) qs.set('day', day)
    router.push(`/passenger/book/scheduled?${qs}`)
  }

  const clear = () => {
    setSearch(''); setDay('')
    router.push('/passenger/book/scheduled')
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Search route</label>
        <input
          type="text"
          className="input text-sm w-48"
          placeholder="Location name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
        <select className="input text-sm" value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="">Any day</option>
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
          <option value="7">Sunday</option>
        </select>
      </div>
      <button onClick={apply} className="btn-primary text-sm px-4 py-2">Filter</button>
      {(search || day) && (
        <button onClick={clear} className="text-sm text-gray-400 hover:text-gray-600">Clear</button>
      )}
    </div>
  )
}
