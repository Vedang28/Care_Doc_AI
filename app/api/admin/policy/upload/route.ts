import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  const userOrError = await requireAuth('ADMIN')
  if (isNextResponse(userOrError)) return userOrError
  const user = userOrError

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse('Invalid form data', 'INVALID_FORM_DATA')
  }

  const file = formData.get('file') as File | null
  if (!file) return errorResponse('No file provided', 'NO_FILE')

  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse('File type not allowed. Use PDF, DOCX, or TXT.', 'INVALID_FILE_TYPE')
  }

  if (file.size > MAX_SIZE) {
    return errorResponse('File too large. Maximum 10MB.', 'FILE_TOO_LARGE')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileId = `${Date.now()}-${file.name}`

  // R2 upload (if configured)
  const r2Key = `policies/${user.agencyId}/${fileId}`
  let r2Url: string | null = null

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY
  const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY
  const bucket = process.env.CLOUDFLARE_R2_BUCKET

  if (accountId && accountId !== 'placeholder' && accessKey && accessKey !== 'placeholder') {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey ?? '' },
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket ?? 'caredocai-assets',
          Key: r2Key,
          Body: buffer,
          ContentType: file.type,
        }),
      )
      r2Url = r2Key
    } catch (err) {
      console.error('[policy/upload] R2 upload failed:', err)
      // Graceful fallback — continue without R2
    }
  }

  return NextResponse.json({
    fileId,
    filename: file.name,
    size: file.size,
    type: file.type,
    r2Key: r2Url,
    // Buffer passed as base64 for the extract endpoint to process in the same session.
    // In a production setup with persistent R2 storage this would be fetched from R2 instead.
    buffer: buffer.toString('base64'),
  })
}
