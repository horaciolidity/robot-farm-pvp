import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, ok } from '@/lib/auth'

// GET /api/rankings?type=production
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'production'

  let rankings

  if (type === 'production') {
    rankings = await prisma.avatar.findMany({
      orderBy: { totalProduced: 'desc' },
      take: 50,
      select: {
        name: true, avatarType: true, imageId: true,
        level: true, totalProduced: true, totalJobs: true,
        userId: true,
      },
    })
  } else if (type === 'level') {
    rankings = await prisma.avatar.findMany({
      orderBy: [{ level: 'desc' }, { totalXP: 'desc' }],
      take: 50,
      select: {
        name: true, avatarType: true, imageId: true,
        level: true, totalXP: true, totalProduced: true,
        userId: true,
      },
    })
  } else if (type === 'efficiency') {
    // Most upgrades applied
    rankings = await prisma.avatar.findMany({
      orderBy: { totalUpgrades: 'desc' },
      take: 50,
      select: {
        name: true, avatarType: true, imageId: true,
        level: true, totalUpgrades: true, totalProduced: true,
        userId: true,
      },
    })
  } else {
    rankings = await prisma.avatar.findMany({
      orderBy: { totalProduced: 'desc' },
      take: 50,
      select: {
        name: true, avatarType: true, imageId: true,
        level: true, totalProduced: true, totalJobs: true,
        userId: true,
      },
    })
  }

  // Find current user rank
  const userRankIndex = rankings.findIndex((r: any) => r.userId === auth.sub)

  return ok({
    type,
    rankings: rankings.map((r: any, i: number) => ({ ...r, rank: i + 1, isCurrentUser: r.userId === auth.sub })),
    userRank: userRankIndex >= 0 ? userRankIndex + 1 : null,
  })
}
