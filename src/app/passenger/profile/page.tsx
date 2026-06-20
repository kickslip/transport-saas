import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import ProfileForm from './ProfileForm'

export default async function PassengerProfilePage() {
  const session = await auth()
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true, firstName: true, lastName: true,
          email: true, phoneNumber: true, avatarUrl: true,
          createdAt: true,
        },
      })
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      {user ? <ProfileForm user={user} /> : <p className="text-gray-500">Unable to load profile.</p>}

      {/* POPIA — Data Rights */}
      <div className="card border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-1">Privacy & Data Rights (POPIA)</h2>
        <p className="text-sm text-gray-500 mb-3">
          In accordance with the Protection of Personal Information Act (POPIA), you may request a copy of all personal data we hold about you.
        </p>
        <a
          href="/api/popia/export"
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          📥 Download My Data (JSON)
        </a>
      </div>
    </div>
  )
}
