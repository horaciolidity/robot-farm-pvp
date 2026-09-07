import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, ok } from '@/lib/auth'

// GET /api/inventory
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const inventory = await prisma.inventory.findMany({
    where: { userId: auth.sub },
    include: { resource: true },
    orderBy: { resource: { category: 'asc' } },
  })

  return ok(inventory)
}
