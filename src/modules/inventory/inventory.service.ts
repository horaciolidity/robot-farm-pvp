import { prisma } from '@/lib/prisma'
import { STARTER_RESOURCES } from '../upgrades/upgrades.constants'

// ============================================================
// INVENTORY SERVICE
// ============================================================

/**
 * Get full inventory for a user (joined with resource data)
 */
export async function getUserInventory(userId: string) {
  return prisma.inventory.findMany({
    where: { userId },
    include: { resource: true },
    orderBy: { resource: { category: 'asc' } },
  })
}

/**
 * Get amount of a specific resource for a user
 */
export async function getResourceAmount(userId: string, resourceKey: string): Promise<number> {
  const resource = await prisma.resource.findUnique({ where: { key: resourceKey } })
  if (!resource) return 0

  const inv = await prisma.inventory.findUnique({
    where: { userId_resourceId: { userId, resourceId: resource.id } },
  })
  return inv?.amount ?? 0
}

/**
 * Add resources to user inventory (upsert)
 */
export async function addResources(
  userId: string,
  additions: { resourceId: string; amount: number }[]
) {
  for (const { resourceId, amount } of additions) {
    if (amount <= 0) continue
    await prisma.inventory.upsert({
      where: { userId_resourceId: { userId, resourceId } },
      update: { amount: { increment: amount } },
      create: { userId, resourceId, amount },
    })
  }
}

/**
 * Deduct resources from user inventory.
 * Returns false if any resource is insufficient.
 */
export async function deductResources(
  userId: string,
  deductions: { resourceId: string; amount: number }[]
): Promise<{ success: boolean; missing?: string }> {
  // Check all balances first
  for (const { resourceId, amount } of deductions) {
    if (amount <= 0) continue
    const inv = await prisma.inventory.findUnique({
      where: { userId_resourceId: { userId, resourceId } },
    })
    if (!inv || inv.amount < amount) {
      const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
      return { success: false, missing: resource?.name ?? resourceId }
    }
  }

  // All good — deduct atomically
  for (const { resourceId, amount } of deductions) {
    if (amount <= 0) continue
    await prisma.inventory.update({
      where: { userId_resourceId: { userId, resourceId } },
      data: { amount: { decrement: amount } },
    })
  }

  return { success: true }
}

/**
 * Check if user has enough of multiple resources
 */
export async function hasEnoughResources(
  userId: string,
  requirements: { resourceKey: string; amount: number }[]
): Promise<{ sufficient: boolean; missing: { resource: string; required: number; have: number }[] }> {
  const missing: { resource: string; required: number; have: number }[] = []

  for (const req of requirements) {
    const have = await getResourceAmount(userId, req.resourceKey)
    if (have < req.amount) {
      missing.push({ resource: req.resourceKey, required: req.amount, have })
    }
  }

  return { sufficient: missing.length === 0, missing }
}

/**
 * Initialize starter resources for a new user
 */
export async function giveStarterResources(userId: string) {
  const resources = await prisma.resource.findMany({
    where: { key: { in: Object.keys(STARTER_RESOURCES) } },
  })

  const additions = resources.map(r => ({
    resourceId: r.id,
    amount: STARTER_RESOURCES[r.key] ?? 0,
  }))

  await addResources(userId, additions)
}
