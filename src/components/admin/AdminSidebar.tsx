'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Tenants', href: '/admin/tenants', icon: '🏢' },
  { name: 'Users', href: '/admin/users', icon: '👥' },
  { name: 'Vehicles', href: '/admin/vehicles', icon: '🚗' },
  { name: 'Trips', href: '/admin/trips', icon: '📍' },
  { name: 'Bookings', href: '/admin/bookings', icon: '🎫' },
  { name: 'Payments', href: '/admin/payments', icon: '💰' },
  { name: 'Invoices', href: '/admin/invoices', icon: '📄' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="flex items-center h-16 px-6 border-b">
        <span className="text-xl font-bold text-primary-600">Admin</span>
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

      <div className="absolute bottom-0 w-64 p-4 border-t">
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
