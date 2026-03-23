import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Role } from '@prisma/client'

export type AgencyContext = {
  id: string
  agencyId: string
  role: Role
  name: string
}

/**
 * Use in every API route handler.
 * Returns the authenticated user with agencyId guaranteed.
 * Throws on unauthenticated or if user not found.
 */
export async function getAgencyContext(): Promise<AgencyContext> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('UNAUTHENTICATED')

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, agencyId: true, role: true, name: true },
  })
  return user
}

/**
 * Assert that a given entityAgencyId matches the context agencyId.
 * Throws 'FORBIDDEN' if mismatch.
 */
export function assertSameAgency(ctx: AgencyContext, entityAgencyId: string) {
  if (ctx.agencyId !== entityAgencyId) throw new Error('FORBIDDEN')
}
