import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { auth } = NextAuth({
  providers: [Credentials({})],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token }) { return token },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
      }
      return session
    },
  },
})
