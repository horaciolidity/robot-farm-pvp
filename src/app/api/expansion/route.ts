import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, badRequest, ok } from '@/lib/auth'
import { deductResources } from '@/modules/inventory/inventory.service'
import { grantAchievement } from '@/modules/rewards/rewards.service'

// GET /api/expansion
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const avatar = await prisma.avatar.findUnique({ where: { userId: auth.sub } })
  if (!avatar) return badRequest('Avatar not found')

  const nextTier = avatar.expansionLevel + 1
  const nextExpansion = await prisma.expansionTier.findUnique({
    where: { tier: nextTier },
    include: { costs: { include: { resource: true } } },
  })

  const currentRobots = await prisma.robot.count({
    where: { userId: auth.sub, status: { not: 'RETIRED' } },
  })

  // Check if user can afford next expansion
  let canAfford = false
  if (nextExpansion) {
    const userInventory = await prisma.inventory.findMany({ where: { userId: auth.sub } })
    const inventoryMap = Object.fromEntries(userInventory.map((i: any) => [i.resourceId, i.amount]))
    canAfford = nextExpansion.costs.every(c => (inventoryMap[c.resourceId] ?? 0) >= c.amount)
  }

  return ok({
    current: {
      robotSlots: avatar.robotSlots,
      currentRobots,
      expansionLevel: avatar.expansionLevel,
    },
    next: nextExpansion
      ? {
          tier: nextExpansion.tier,
          slotsGranted: nextExpansion.slotsGranted,
          costs: nextExpansion.costs.map(c => ({
            resource: c.resource.name,
            icon: c.resource.icon,
            color: c.resource.color,
            resourceKey: c.resource.key,
            required: c.amount,
            have: 0, // will be filled by frontend from inventory
          })),
          canAfford,
        }
      : null,
    maxReached: !nextExpansion,
  })
}

// POST /api/expansion — execute expansion
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const avatar = await prisma.avatar.findUnique({ where: { userId: auth.sub } })
  if (!avatar) return badRequest('Avatar not found')

  const nextTier = avatar.expansionLevel + 1
  const expansion = await prisma.expansionTier.findUnique({
    where: { tier: nextTier },
    include: { costs: { include: { resource: true } } },
  })

  if (!expansion) return badRequest('Maximum expansion already reached')

  const deductions = expansion.costs.map(c => ({ resourceId: c.resourceId, amount: c.amount }))
  const result = await deductResources(auth.sub, deductions)

  if (!result.success) {
    return badRequest(`Insufficient ${result.missing} for expansion`)
  }

  const updated = await prisma.avatar.update({
    where: { userId: auth.sub },
    data: {
      robotSlots: expansion.slotsGranted,
      expansionLevel: nextTier,
    },
  })

  if (nextTier === 1) await grantAchievement(auth.sub, 'FIRST_EXPANSION')

  return ok({
    avatar: updated,
    message: `🏗️ Capacity expanded! You can now deploy ${expansion.slotsGranted} robots.`,
    newSlots: expansion.slotsGranted,
  })
}
