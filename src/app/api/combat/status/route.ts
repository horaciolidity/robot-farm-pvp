import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, ok } from '@/lib/auth'

// GET /api/combat/status — combat unlock requirements
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const avatar = await prisma.avatar.findUnique({ where: { userId: auth.sub } })
  if (!avatar) return ok({ locked: true, requirements: [] })

  const combatType = await prisma.robotType.findUnique({
    where: { key: 'COMBAT' },
  })

  const requirements = combatType?.unlockRequirements as Record<string, number> | null

  const titaniumInv = await prisma.inventory.findFirst({
    where: { userId: auth.sub, resource: { key: 'TITANIUM' } },
    include: { resource: true },
  })
  const titaniumAmount = titaniumInv?.amount ?? 0

  const checks = [
    {
      label: '8 Robot Slots',
      description: 'Expand your base to maximum capacity',
      met: avatar.robotSlots >= 8,
      current: avatar.robotSlots,
      required: 8,
    },
    {
      label: '1,000,000 Total Production',
      description: 'Prove your industrial dominance',
      met: avatar.totalProduced >= 1_000_000,
      current: avatar.totalProduced,
      required: 1_000_000,
    },
    {
      label: '5,000 Titanium',
      description: 'Rare material for combat chassis',
      met: titaniumAmount >= 5000,
      current: titaniumAmount,
      required: 5000,
    },
    {
      label: 'Level 20',
      description: 'Reach senior operator status',
      met: avatar.level >= 20,
      current: avatar.level,
      required: 20,
    },
  ]

  const allMet = checks.every((c: any) => c.met)

  return ok({
    locked: !allMet,
    allMet,
    checks,
    progressPercent: Math.round((checks.filter((c: any) => c.met).length / checks.length) * 100),
  })
}
