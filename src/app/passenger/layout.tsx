import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PassengerSidebar } from '@/components/passenger/PassengerSidebar'
import { getTenantTheme } from '@/lib/tenant'
import TenantThemeInjector from '@/components/shared/TenantThemeInjector'

export default async function PassengerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || !['PASSENGER', 'ADMIN'].includes(session.user.role)) {
    redirect('/auth/signin?callbackUrl=/passenger')
  }

  const theme = await getTenantTheme()

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantThemeInjector primaryColor={theme.primaryColor} tenantName={theme.name} />
      <div className="flex h-screen">
        <PassengerSidebar />
        <main className="flex-1 overflow-y-auto pt-14 pb-20 px-4 lg:pt-0 lg:pb-0 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
