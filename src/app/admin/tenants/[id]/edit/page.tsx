import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { updateTenantSettings } from '@/app/actions/admin'

export default async function EditTenantPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/admin')

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: { tenantBilling: true },
  })
  if (!tenant) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants" className="text-gray-500 hover:text-gray-700">← Tenants</Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Tenant: {tenant.name}</h1>
      </div>

      <form
        action={async (fd: FormData) => {
          'use server'
          await updateTenantSettings(params.id, {
            name: fd.get('name') as string,
            contactEmail: fd.get('contactEmail') as string,
            contactPhone: fd.get('contactPhone') as string,
            address: fd.get('address') as string,
            primaryColor: fd.get('primaryColor') as string,
            logoUrl: fd.get('logoUrl') as string,
          })
          redirect('/admin/tenants')
        }}
        className="card space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input name="name" required className="input w-full" defaultValue={tenant.name} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
            <input name="contactEmail" type="email" required className="input w-full" defaultValue={tenant.contactEmail} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
            <input name="contactPhone" className="input w-full" defaultValue={tenant.contactPhone ?? ''} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input name="address" className="input w-full" defaultValue={tenant.address ?? ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Brand Color</label>
            <div className="flex gap-2 items-center">
              <input
                name="primaryColor"
                type="color"
                className="h-10 w-16 rounded cursor-pointer border border-gray-200"
                defaultValue={tenant.primaryColor ?? '#2563eb'}
              />
              <span className="text-xs text-gray-500">Used in driver/passenger app header</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input name="logoUrl" type="url" className="input w-full" placeholder="https://..." defaultValue={tenant.logoUrl ?? ''} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">Save Changes</button>
          <Link href="/admin/tenants" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
