import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, badRequest, ok } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return badRequest('email and password are required')
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return badRequest('Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return badRequest('Invalid credentials')

    const token = await signToken({ sub: user.id, username: user.username })
    const avatar = await prisma.avatar.findUnique({ where: { userId: user.id } })

    return ok({
      token,
      user: { id: user.id, username: user.username, email: user.email },
      hasAvatar: !!avatar,
    })
  } catch (e) {
    console.error('[POST /api/auth/login]', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
