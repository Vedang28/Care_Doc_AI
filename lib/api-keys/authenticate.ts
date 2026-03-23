import { db } from '@/lib/db'
import { verifyApiKey } from '@/lib/api-keys'
import type { NextRequest } from 'next/server'

export interface ApiKeyContext {
  agencyId: string
  keyId: string
  scopes: string[]
}

export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyContext | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.slice(7)
  if (!rawKey.startsWith('cda_')) return null

  // Find by prefix (first 16 chars)
  const prefix = rawKey.substring(0, 16)
  const apiKey = await db.apiKey.findFirst({
    where: { keyPrefix: prefix, active: true },
  })
  if (!apiKey) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null

  const valid = await verifyApiKey(rawKey, apiKey.keyHash)
  if (!valid) return null

  // Update lastUsedAt async
  void db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })

  return { agencyId: apiKey.agencyId, keyId: apiKey.id, scopes: apiKey.scopes }
}
