import { prisma } from './db'
import { auth } from './auth'

export type TenantTheme = {
  name: string
  primaryColor: string
  logoUrl: string | null
}

const DEFAULT_THEME: TenantTheme = {
  name: 'WanToe',
  primaryColor: '#2563eb',
  logoUrl: null,
}

export async function getTenantTheme(): Promise<TenantTheme> {
  try {
    const session = await auth()
    const tenantId = (session?.user as any)?.tenantId
    if (!tenantId) return DEFAULT_THEME

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, primaryColor: true, logoUrl: true },
    })
    if (!tenant) return DEFAULT_THEME

    return {
      name: tenant.name,
      primaryColor: tenant.primaryColor ?? DEFAULT_THEME.primaryColor,
      logoUrl: tenant.logoUrl,
    }
  } catch {
    return DEFAULT_THEME
  }
}
