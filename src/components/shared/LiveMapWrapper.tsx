'use client'

import dynamic from 'next/dynamic'

const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm" style={{ height: '300px' }}>
      Loading map...
    </div>
  ),
})

export default LiveMap
