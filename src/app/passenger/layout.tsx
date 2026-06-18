import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { PassengerSidebar } from '@/components/passenger/PassengerSidebar'

export default async function PassengerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !['PASSENGER', 'ADMIN'].includes(session.user.role)) {
    redirect('/auth/signin?callbackUrl=/passenger')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <PassengerSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
