import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export function generateApiKey(agencyCode: string): { key: string; prefix: string } {
  const random = crypto.randomBytes(24).toString('base64url')
  const key = `cda_${agencyCode}_${random}`
  const prefix = key.substring(0, 16)
  return { key, prefix }
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10)
}

export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash)
}
