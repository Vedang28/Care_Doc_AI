import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'
import type { Role } from '@prisma/client'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            agencyId: true,
            passwordHash: true,
          },
        })

        if (!user) return null

        const valid = await compare(password, user.passwordHash)
        if (!valid) return null

        // Update lastLoginAt
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          agencyId: user.agencyId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as unknown as { role: Role }).role
        token.agencyId = (user as unknown as { agencyId: string }).agencyId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as { id: string; role: Role; agencyId: string }
        u.id       = token.id as string
        u.role     = token.role as Role
        u.agencyId = token.agencyId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours — shift length
  },
})
