import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isNextResponse, errorResponse } from '@/lib/api-helpers'
import { managerReportsQuerySchema } from '@/lib/validations/report'

export async function GET(request: NextRequest) {
  const userOrError = await requireAuth('MANAGER')
  if (isNextResponse(userOrError)) return userOrError

  const { searchParams } = request.nextUrl
  const parsed = managerReportsQuerySchema.safeParse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    clientId: searchParams.get('clientId') ?? undefined,
    caregiverId: searchParams.get('caregiverId') ?? undefined,
    hasFlags: searchParams.get('hasFlags') ?? undefined,
  })

  if (!parsed.success) {
    return errorResponse('Invalid query params', 'VALIDATION_ERROR', 400, parsed.error.flatten())
  }

  const { page, limit, clientId, caregiverId, hasFlags } = parsed.data
  const skip = (page - 1) * limit

  try {
    const where = {
      agencyId: userOrError.agencyId,
      ...(clientId ? { visit: { clientId } } : {}),
      ...(caregiverId ? { visit: { caregiverId } } : {}),
      ...(hasFlags === 'true' ? { NOT: { flags: { isEmpty: true } } } : {}),
    }

    const [reports, total] = await db.$transaction([
      db.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          flags: true,
          status: true,
          visit: {
            select: {
              id: true,
              checkInAt: true,
              checkOutAt: true,
              status: true,
              _count: { select: { tasks: true } },
              client: { select: { name: true } },
              caregiver: { select: { name: true } },
            },
          },
        },
      }),
      db.report.count({ where }),
    ])

    const data = reports.map((r) => ({
      reportId: r.id,
      visitId: r.visit.id,
      clientName: r.visit.client.name,
      caregiverName: r.visit.caregiver.name,
      checkInAt: r.visit.checkInAt.toISOString(),
      checkOutAt: r.visit.checkOutAt?.toISOString() ?? null,
      taskCount: r.visit._count.tasks,
      flagCount: r.flags.length,
      status: r.status,
      visitStatus: r.visit.status,
    }))

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return errorResponse('Failed to fetch reports', 'FETCH_ERROR', 500, error)
  }
}
