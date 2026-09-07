import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, badRequest, ok } from '@/lib/auth'
import { deductResources, addResources } from '@/modules/inventory/inventory.service'
import { grantAchievement } from '@/modules/rewards/rewards.service'

// GET /api/market
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const resources = await prisma.resource.findMany({
    include: {
      priceHistory: {
        orderBy: { recordedAt: 'desc' },
        take: 24,
      },
    },
    orderBy: { category: 'asc' },
  })

  const userInventory = await prisma.inventory.findMany({ where: { userId: auth.sub } })
  const inventoryMap = Object.fromEntries(userInventory.map(i => [i.resourceId, i.amount]))

  return ok(
    resources.map(r => ({
      id: r.id, key: r.key, name: r.name, symbol: r.symbol,
      icon: r.icon, color: r.color, category: r.category,
      currentPrice: r.currentPrice, basePrice: r.basePrice,
      userBalance: inventoryMap[r.id] ?? 0,
      priceChange24h: r.priceHistory.length >= 2
        ? ((r.currentPrice - r.priceHistory[r.priceHistory.length - 1].price) / r.priceHistory[r.priceHistory.length - 1].price) * 100
        : 0,
      history: [...r.priceHistory].reverse().map(h => ({ price: h.price, time: h.recordedAt })),
    }))
  )
}

// POST /api/market — sell or buy
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const body = await req.json()
  const { type, resourceKey, amount } = body

  if (!type || !resourceKey || !amount || amount <= 0) {
    return badRequest('type, resourceKey and amount are required')
  }

  const resource = await prisma.resource.findUnique({ where: { key: resourceKey } })
  if (!resource) return badRequest('Resource not found')

  const totalValue = resource.currentPrice * amount

  if (type === 'SELL') {
    const result = await deductResources(auth.sub, [{ resourceId: resource.id, amount }])
    if (!result.success) return badRequest(`Insufficient ${resource.name}`)

    // Add USDC virtual balance (stored as resource for now)
    // In Web3 phase this becomes an on-chain transfer
    const usdcResource = await prisma.resource.findFirst({ where: { key: 'USDC' } })
    if (usdcResource) {
      await addResources(auth.sub, [{ resourceId: usdcResource.id, amount: totalValue }])
    }

    await prisma.marketOrder.create({
      data: {
        userId: auth.sub, resourceId: resource.id,
        type: 'SELL', amount, pricePerUnit: resource.currentPrice,
        totalValue, status: 'FILLED', filledAt: new Date(),
      },
    })

    await grantAchievement(auth.sub, 'MARKET_SELL')

    return ok({
      message: `Sold ${amount} ${resource.name} for $${totalValue.toFixed(4)} USDC`,
      totalValue,
    })
  }

  if (type === 'BUY') {
    // Deduct USDC
    const usdcResource = await prisma.resource.findFirst({ where: { key: 'USDC' } })
    if (usdcResource) {
      const result = await deductResources(auth.sub, [{ resourceId: usdcResource.id, amount: totalValue }])
      if (!result.success) return badRequest('Insufficient USDC balance')
    }

    await addResources(auth.sub, [{ resourceId: resource.id, amount }])

    await prisma.marketOrder.create({
      data: {
        userId: auth.sub, resourceId: resource.id,
        type: 'BUY', amount, pricePerUnit: resource.currentPrice,
        totalValue, status: 'FILLED', filledAt: new Date(),
      },
    })

    return ok({
      message: `Bought ${amount} ${resource.name} for $${totalValue.toFixed(4)} USDC`,
      totalValue,
    })
  }

  return badRequest('type must be SELL or BUY')
}
