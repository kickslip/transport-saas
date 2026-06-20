import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DriverSidebar } from '@/components/driver/DriverSidebar'
import { getTenantTheme } from '@/lib/tenant'
import TenantThemeInjector from '@/components/shared/TenantThemeInjector'

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || !['DRIVER', 'ADMIN'].includes(session.user.role)) {
    redirect('/auth/signin?callbackUrl=/driver')
  }

  const theme = await getTenantTheme()

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantThemeInjector primaryColor={theme.primaryColor} tenantName={theme.name} />
      <div className="flex h-screen">
        <DriverSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
