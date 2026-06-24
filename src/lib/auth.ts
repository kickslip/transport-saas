import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantId: z.string().optional(),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantId: { label: 'Tenant ID', type: 'text' },
      },
      async authorize(credentials) {
        try {
          console.log('[authorize] credentials received:', credentials?.email)
          const parsed = credentialsSchema.parse(credentials)
          console.log('[authorize] parsed:', parsed.email)

          const user = await prisma.user.findUnique({
            where: { email: parsed.email },
            include: { tenant: true },
          })
          console.log('[authorize] user found:', !!user, 'active:', user?.isActive)

          if (!user || !user.passwordHash) return null
          if (!user.isActive) return null

          const isValid = await bcrypt.compare(parsed.password, user.passwordHash)
          console.log('[authorize] password valid:', isValid)
          if (!isValid) return null

          if (parsed.tenantId && user.tenantId !== parsed.tenantId) return null

          console.log('[authorize] returning user:', user.email, user.role)
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            tenantId: user.tenantId,
            image: user.avatarUrl,
          }
        } catch (e: any) {
          console.error('[authorize] credentials sign-in error:', e)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
      }

      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.tenantId = dbUser.tenantId
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).tenantId = token.tenantId
      }
      return session
    },
  },
})
