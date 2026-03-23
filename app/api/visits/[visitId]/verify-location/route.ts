import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { haversineDistance } from '@/lib/utils'
import { z } from 'zod'

const verifySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

interface RouteParams { params: { visitId: string } }

export async function POST(request: NextRequest, { params }: RouteParams) {
  const userOrError = await requireAuth()
  if (isNextResponse(userOrError)) return userOrError

  let body: unknown
  try { body = await request.json() } catch { return errorResponse('Invalid JSON', 'INVALID_JSON') }

  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const { lat, lng } = parsed.data

  try {
    const visit = await db.visit.findFirst({
      where: { id: params.visitId, caregiverId: userOrError.id },
      include: { client: { select: { address: true } } },
    })

    if (!visit) return errorResponse('Visit not found', 'NOT_FOUND', 404)

    // Store caregiver's GPS coordinates on the visit
    await db.visit.update({
      where: { id: params.visitId },
      data: { locationLat: lat, locationLng: lng },
    })

    // Geocode client address using Google Maps API if key is available
    const googleKey = process.env.GOOGLE_MAPS_API_KEY
    if (!googleKey) {
      return NextResponse.json({ status: 'no_geocoding', distanceMetres: null, mismatch: false })
    }

    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(visit.client.address)}&key=${googleKey}`
    )
    const geoData = await geoRes.json() as {
      status: string
      results: Array<{ geometry: { location: { lat: number; lng: number } } }>
    }

    if (geoData.status !== 'OK' || !geoData.results[0]) {
      return NextResponse.json({ status: 'geocode_failed', distanceMetres: null, mismatch: false })
    }

    const clientLoc = geoData.results[0].geometry.location
    const distanceMetres = haversineDistance(lat, lng, clientLoc.lat, clientLoc.lng)
    const mismatch = distanceMetres > 300

    if (mismatch) {
      await db.auditLog.create({
        data: {
          agencyId: userOrError.agencyId,
          userId: userOrError.id,
          action: 'LOCATION_MISMATCH',
          entityType: 'Visit',
          entityId: params.visitId,
          after: { distanceMetres: Math.round(distanceMetres), threshold: 300 },
        },
      })
    }

    return NextResponse.json({
      status: 'ok',
      distanceMetres: Math.round(distanceMetres),
      mismatch,
      flag: mismatch
        ? `Location mismatch: caregiver was recorded ${Math.round(distanceMetres)}m from client address`
        : null,
    })
  } catch (error) {
    return errorResponse('Failed to verify location', 'LOCATION_ERROR', 500, error)
  }
}
