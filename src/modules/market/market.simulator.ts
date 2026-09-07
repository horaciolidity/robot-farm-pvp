import { prisma } from '@/lib/prisma'

// ============================================================
// MARKET SIMULATOR
// Simulates price fluctuations. Replace with oracle/DEX for Web3.
// ============================================================

const VOLATILITY = 0.05     // ±5% max change per tick
const RECOVERY_FORCE = 0.02 // pull toward base price

export async function tickMarketPrices() {
  const resources = await prisma.resource.findMany()

  for (const resource of resources) {
    const rand = (Math.random() - 0.5) * 2 * VOLATILITY
    const recovery = (resource.basePrice - resource.currentPrice) / resource.basePrice * RECOVERY_FORCE
    const change = rand + recovery
    const newPrice = Math.max(
      resource.basePrice * 0.3,
      Math.min(resource.basePrice * 3, resource.currentPrice * (1 + change))
    )

    await prisma.resource.update({
      where: { id: resource.id },
      data: { currentPrice: newPrice },
    })

    // Record history
    await prisma.resourcePriceHistory.create({
      data: { resourceId: resource.id, price: newPrice },
    })
  }
}

export async function getMarketData() {
  const resources = await prisma.resource.findMany({
    include: {
      priceHistory: {
        orderBy: { recordedAt: 'desc' },
        take: 24,
      },
    },
    orderBy: { category: 'asc' },
  })

  return resources.map(r => ({
    id: r.id,
    key: r.key,
    name: r.name,
    symbol: r.symbol,
    icon: r.icon,
    color: r.color,
    category: r.category,
    currentPrice: r.currentPrice,
    basePrice: r.basePrice,
    priceChange24h: r.priceHistory.length >= 2
      ? ((r.currentPrice - r.priceHistory[r.priceHistory.length - 1].price) / r.priceHistory[r.priceHistory.length - 1].price) * 100
      : 0,
    history: r.priceHistory.reverse().map(h => ({
      price: h.price,
      time: h.recordedAt,
    })),
  }))
}
