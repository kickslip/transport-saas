import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DriverProfileForm from './ProfileForm'

export default async function DriverProfilePage() {
  const session = await auth()
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true, firstName: true, lastName: true,
          email: true, phoneNumber: true, avatarUrl: true,
          driverStatus: true, createdAt: true,
        },
      })
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">My Profile</h1>
      {user ? <DriverProfileForm user={user} /> : <p className="text-gray-500">Unable to load profile.</p>}
    </div>
  )
}
