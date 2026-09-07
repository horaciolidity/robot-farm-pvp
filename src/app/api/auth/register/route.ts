import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, created, badRequest } from '@/lib/auth'
import { giveStarterResources } from '@/modules/inventory/inventory.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, email, password } = body

    if (!username || !email || !password) {
      return badRequest('username, email and password are required')
    }
    if (password.length < 6) {
      return badRequest('Password must be at least 6 characters')
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing) {
      return badRequest('Username or email already taken')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    })

    // Give starter resources
    await giveStarterResources(user.id)

    const token = await signToken({ sub: user.id, username: user.username })

    return created({
      token,
      user: { id: user.id, username: user.username, email: user.email },
      message: 'Account created successfully',
    })
  } catch (e) {
    console.error('[POST /api/auth/register]', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
