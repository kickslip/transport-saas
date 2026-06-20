'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function NotificationBell() {
  const { supported, subscribed, loading, subscribe } = usePushNotifications()

  if (!supported) return null

  if (subscribed) {
    return (
      <span title="Notifications enabled" className="text-green-500 text-lg select-none">🔔</span>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      title="Enable push notifications"
      className="text-gray-400 hover:text-primary-600 transition-colors text-lg"
    >
      {loading ? '…' : '🔕'}
    </button>
  )
}
