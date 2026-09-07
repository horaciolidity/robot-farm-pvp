import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, ok } from '@/lib/auth'

// GET /api/rewards — achievements with unlock status
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const allAchievements = await prisma.achievement.findMany({
    include: {
      rewards: { include: { resource: true } },
      unlocked: { where: { userId: auth.sub } },
    },
    orderBy: [{ category: 'asc' }, { xpReward: 'asc' }],
  })

  return ok(
    allAchievements.map((a: any) => ({
      id: a.id, key: a.key, title: a.title, description: a.description,
      icon: a.icon, category: a.category, xpReward: a.xpReward,
      rewards: a.rewards.map((r: any) => ({ name: r.resource.name, icon: r.resource.icon, amount: r.amount })),
      unlocked: a.unlocked.length > 0,
      unlockedAt: a.unlocked[0]?.unlockedAt ?? null,
    }))
  )
}
