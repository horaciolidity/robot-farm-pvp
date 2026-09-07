import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, badRequest, ok, created } from '@/lib/auth'
import { deductResources } from '@/modules/inventory/inventory.service'
import { grantAchievement } from '@/modules/rewards/rewards.service'

// GET /api/robots — list user's robots with active job info
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const robots = await prisma.robot.findMany({
    where: { userId: auth.sub },
    include: {
      robotType: {
        include: {
          producedResource: true,
          consumptions: { include: { resource: true } },
        },
      },
      jobs: {
        where: { status: { in: ['RUNNING', 'COMPLETED'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { outputResource: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return ok(robots)
}

// POST /api/robots — acquire a new robot (costs resources)
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const body = await req.json()
  const { robotTypeKey, name } = body

  if (!robotTypeKey) return badRequest('robotTypeKey is required')

  const avatar = await prisma.avatar.findUnique({ where: { userId: auth.sub } })
  if (!avatar) return badRequest('Create your avatar first')

  const robotType = await prisma.robotType.findUnique({
    where: { key: robotTypeKey },
    include: {
      acquisitionCosts: { include: { resource: true } },
    },
  })
  if (!robotType) return badRequest('Invalid robot type')
  if (robotType.isLocked) return badRequest('This robot type is locked')
  if (avatar.level < robotType.requiredAvatarLevel) {
    return badRequest(`Requires avatar level ${robotType.requiredAvatarLevel}`)
  }

  // Check capacity
  const currentRobots = await prisma.robot.count({
    where: { userId: auth.sub, status: { not: 'RETIRED' } },
  })
  if (currentRobots >= avatar.robotSlots) {
    return badRequest(`Robot capacity full (${currentRobots}/${avatar.robotSlots}). Expand your capacity first.`)
  }

  // Deduct acquisition costs
  const deductions = robotType.acquisitionCosts.map(c => ({
    resourceId: c.resourceId,
    amount: c.amount,
  }))

  if (deductions.length > 0) {
    const result = await deductResources(auth.sub, deductions)
    if (!result.success) {
      return badRequest(`Insufficient ${result.missing} to acquire this robot`)
    }
  }

  // Generate robot name
  const robotCount = await prisma.robot.count({ where: { userId: auth.sub } })
  const robotName = name ?? `${robotType.name.split(' ')[0]} #${String(robotCount + 1).padStart(3, '0')}`

  const robot = await prisma.robot.create({
    data: {
      userId: auth.sub,
      robotTypeId: robotType.id,
      name: robotName,
    },
    include: { robotType: true },
  })

  // Achievements
  const allRobots = await prisma.robot.count({
    where: { userId: auth.sub, status: { not: 'RETIRED' } },
  })
  if (allRobots >= 2) await grantAchievement(auth.sub, 'SECOND_ROBOT')

  // Check FULL_CAPACITY
  if (allRobots >= avatar.robotSlots) await grantAchievement(auth.sub, 'FULL_CAPACITY')

  return created({ robot, message: `${robot.name} acquired and ready for deployment!` })
}
