import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import LinkedIn from 'next-auth/providers/linkedin'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/crypto'
import { resolveRole } from '@/lib/auth/roles'

// NOTE: PrismaAdapter is intentionally NOT used here.
// JWT sessions + manual OAuth account creation in signIn callback.
// PrismaAdapter alongside manual creation causes unique-constraint violations.

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID || process.env.AUTH_LINKEDIN_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || process.env.AUTH_LINKEDIN_SECRET,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user || !user.passwordHash) return null
        const isPasswordValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        )
        if (!isPasswordValid) return null
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.image,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'linkedin') {
        if (!user.email) {
          console.error('[auth] OAuth user has no email — denied')
          return false
        }

        // ── Step 1: Ensure user record exists (CRITICAL — block sign-in if fails) ──
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } }).catch(() => null)

        if (!dbUser) {
          try {
            const nameParts = (user.name || '').split(' ')
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                image: user.image,
                emailVerified: new Date(),
                role: resolveRole(user.email),
              },
            })
          } catch (createErr: any) {
            // Race condition: another request may have created the user
            if (createErr?.code === 'P2002') {
              dbUser = await prisma.user.findUnique({ where: { email: user.email } }).catch(() => null)
            }
            if (!dbUser) {
              console.error('[auth] Could not find or create user:', createErr)
              return false
            }
          }
        }

        // ── Step 2: Link/refresh OAuth account (NON-CRITICAL — don't block sign-in) ──
        try {
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          })
          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                accessToken: account.access_token ?? null,
                refreshToken: account.refresh_token ?? null,
                expiresAt: account.expires_at ?? null,
                tokenType: account.token_type ?? null,
                scope: account.scope ?? null,
                idToken: account.id_token ?? null,
              },
            })
          } else {
            await prisma.account.update({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              data: {
                accessToken: account.access_token ?? null,
                refreshToken: account.refresh_token ?? null,
                expiresAt: account.expires_at ?? null,
              },
            })
          }
        } catch (accountErr) {
          // Non-critical: user exists, so sign-in can still proceed
          console.warn('[auth] Account link/update failed (non-fatal):', accountErr)
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }
      const email = (user?.email || token.email) as string | undefined
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
        }
      } else if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        try {
          // @ts-ignore
          session.user.role = (token.role as string) || 'USER'
        } catch {
          // @ts-ignore
          session.user.role = 'USER'
        }
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      if (user.email) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { lastLoginAt: new Date() },
          })
        } catch {
          // Non-critical
        }
      }
    },
  },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  jwt: { maxAge: 24 * 60 * 60 },
})
