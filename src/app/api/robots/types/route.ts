import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, ok } from '@/lib/auth'

// GET /api/robots/types — all available robot types with costs
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const types = await prisma.robotType.findMany({
    include: {
      producedResource: true,
      consumptions: { include: { resource: true } },
      acquisitionCosts: { include: { resource: true } },
    },
    orderBy: { requiredAvatarLevel: 'asc' },
  })

  return ok(types)
}
