import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DriverSidebar } from '@/components/driver/DriverSidebar'

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !['DRIVER', 'ADMIN'].includes(session.user.role)) {
    redirect('/auth/signin?callbackUrl=/driver')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <DriverSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
