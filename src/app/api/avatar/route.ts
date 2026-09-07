import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, badRequest, ok, created } from '@/lib/auth'
import { grantAchievement } from '@/modules/rewards/rewards.service'

// GET /api/avatar — get current user's avatar
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const avatar = await prisma.avatar.findUnique({
    where: { userId: auth.sub },
  })

  if (!avatar) return Response.json({ data: null }, { status: 200 })
  return ok(avatar)
}

// POST /api/avatar — create avatar (only once)
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const existing = await prisma.avatar.findUnique({ where: { userId: auth.sub } })
  if (existing) return badRequest('Avatar already created')

  const body = await req.json()
  const { name, avatarType } = body

  if (!name || name.trim().length < 2) return badRequest('Name must be at least 2 characters')

  const validTypes = ['ENGINEER', 'COMMANDER', 'HACKER', 'MERCHANT']
  if (!validTypes.includes(avatarType)) return badRequest('Invalid avatar type')

  const imageMap: Record<string, string> = {
    ENGINEER: 'engineer_01',
    COMMANDER: 'commander_01',
    HACKER: 'hacker_01',
    MERCHANT: 'merchant_01',
  }

  const avatar = await prisma.avatar.create({
    data: {
      userId: auth.sub,
      name: name.trim(),
      avatarType,
      imageId: imageMap[avatarType],
    },
  })

  // Give free Miner Robot
  const minerType = await prisma.robotType.findUnique({ where: { key: 'MINER' } })
  if (minerType) {
    await prisma.robot.create({
      data: {
        userId: auth.sub,
        robotTypeId: minerType.id,
        name: 'Miner #001',
        status: 'IDLE',
      },
    })
    await grantAchievement(auth.sub, 'FIRST_ROBOT')
  }

  return created({ avatar, message: 'Avatar created! Your first Miner Robot is ready.' })
}
