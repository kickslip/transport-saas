'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/admin',           icon: '📊' },
  { name: 'Tenants',   href: '/admin/tenants',   icon: '🏢' },
  { name: 'Users',     href: '/admin/users',     icon: '👥' },
  { name: 'Vehicles',  href: '/admin/vehicles',  icon: '🚗' },
  { name: 'Trips',     href: '/admin/trips',     icon: '📍' },
  { name: 'Bookings',  href: '/admin/bookings',  icon: '🎫' },
  { name: 'Payments',  href: '/admin/payments',  icon: '💰' },
  { name: 'Invoices',  href: '/admin/invoices',  icon: '📄' },
  { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { name: 'Audit Log', href: '/admin/audit',     icon: '🔐' },
  { name: 'Settings',  href: '/admin/settings',  icon: '⚙️' },
]

const bottomNav = [
  { name: 'Home',     href: '/admin',          icon: '📊' },
  { name: 'Users',    href: '/admin/users',    icon: '👥' },
  { name: 'Trips',    href: '/admin/trips',    icon: '📍' },
  { name: 'Payments', href: '/admin/payments', icon: '💰' },
  { name: 'More',     href: '#',               icon: '⚙️', isMore: true },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── Desktop sidebar (lg+) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:shadow-lg lg:flex-shrink-0">
        <div className="flex items-center h-16 px-6 border-b">
          <span className="text-xl font-bold text-primary-600">Admin</span>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link key={item.name} href={item.href} className={isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}>
                <span className="mr-3">{item.icon}</span>{item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t">
          <button onClick={() => signOut({ callbackUrl: '/' })} className="sidebar-link-inactive w-full">
            <span className="mr-3">🚪</span>Sign Out
          </button>
        </div>
      </div>

      {/* ── Mobile top bar ────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b shadow-sm flex items-center justify-between px-4">
        <span className="text-lg font-bold text-primary-600">Admin</span>
        <button onClick={() => setOpen(true)} className="p-2 rounded-md text-gray-600 hover:bg-gray-100" aria-label="Open menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Mobile drawer overlay ─────────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-white shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between h-14 px-4 border-b">
              <span className="text-lg font-bold text-primary-600">Admin</span>
              <button onClick={() => setOpen(false)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link key={item.name} href={item.href} onClick={() => setOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                    <span className="mr-3 text-base">{item.icon}</span>{item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t">
              <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                <span className="mr-3">🚪</span>Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile bottom navigation ──────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t shadow-lg flex">
        {bottomNav.map((item) => {
          const isActive = !item.isMore && (pathname === item.href || pathname.startsWith(`${item.href}/`))
          return item.isMore ? (
            <button key={item.name} onClick={() => setOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium text-gray-500 hover:text-gray-900">
              <span className="text-xl mb-0.5">{item.icon}</span>{item.name}
            </button>
          ) : (
            <Link key={item.name} href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}>
              <span className="text-xl mb-0.5">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
