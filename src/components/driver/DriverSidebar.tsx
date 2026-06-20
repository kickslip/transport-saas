'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import NotificationBell from '@/components/shared/NotificationBell'

const navigation = [
  { name: 'Dashboard', href: '/driver', icon: '📊' },
  { name: 'My Trips', href: '/driver/trips', icon: '📍' },
  { name: 'Schedules', href: '/driver/schedules', icon: '📅' },
  { name: 'Earnings', href: '/driver/earnings', icon: '💰' },
  { name: 'Reviews', href: '/driver/reviews', icon: '⭐' },
  { name: 'Messages', href: '/driver/messages', icon: '💬' },
  { name: 'Profile', href: '/driver/profile', icon: '👤' },
]

export function DriverSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="flex items-center h-16 px-6 border-b">
        <span className="text-xl font-bold text-primary-600">Driver</span>
      </div>
      
      <nav className="mt-6 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-gray-400">Notifications</span>
          <NotificationBell />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="sidebar-link-inactive w-full"
        >
          <span className="mr-3">🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  )
}
