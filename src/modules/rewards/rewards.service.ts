import { prisma } from '@/lib/prisma'
import { addResources } from '../inventory/inventory.service'
import { levelFromXP } from '@/lib/formatters'

// ============================================================
// ACHIEVEMENTS SERVICE
// ============================================================

export type AchievementKey =
  | 'FIRST_ROBOT'
  | 'FIRST_JOB'
  | 'FIRST_COLLECT'
  | 'FIRST_UPGRADE'
  | 'FIRST_REPAIR'
  | 'SECOND_ROBOT'
  | 'FIRST_EXPANSION'
  | 'PROD_1000'
  | 'PROD_10000'
  | 'PROD_100000'
  | 'FULL_CAPACITY'
  | 'MARKET_SELL'
  | 'LEVEL_5'
  | 'LEVEL_10'

/**
 * Grant an achievement to a user if not already unlocked.
 * Automatically grants resource rewards.
 * Returns the achievement if newly unlocked, null if already had it.
 */
export async function grantAchievement(
  userId: string,
  key: AchievementKey
): Promise<{ title: string; icon: string; xpReward: number } | null> {
  const achievement = await prisma.achievement.findUnique({
    where: { key },
    include: { rewards: { include: { resource: true } } },
  })
  if (!achievement) return null

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  })
  if (existing) return null

  // Unlock it
  await prisma.userAchievement.create({
    data: { userId, achievementId: achievement.id },
  })

  // Grant resource rewards
  if (achievement.rewards.length > 0) {
    await addResources(
      userId,
      achievement.rewards.map((r: any) => ({ resourceId: r.resourceId, amount: r.amount }))
    )
  }

  // Grant XP
  if (achievement.xpReward > 0) {
    await addXP(userId, achievement.xpReward)
  }

  return { title: achievement.title, icon: achievement.icon, xpReward: achievement.xpReward }
}

/**
 * Add XP to avatar and level up if needed.
 */
export async function addXP(userId: string, xp: number) {
  const avatar = await prisma.avatar.findUnique({ where: { userId } })
  if (!avatar) return

  const newTotalXP = avatar.totalXP + xp
  const { level } = levelFromXP(newTotalXP)

  await prisma.avatar.update({
    where: { userId },
    data: {
      totalXP: newTotalXP,
      experience: newTotalXP,
      level,
    },
  })

  // Check level achievements
  if (level >= 5 && avatar.level < 5) await grantAchievement(userId, 'LEVEL_5')
  if (level >= 10 && avatar.level < 10) await grantAchievement(userId, 'LEVEL_10')
}

/**
 * Check production-based achievements after updating total produced.
 */
export async function checkProductionAchievements(userId: string, totalProduced: number) {
  if (totalProduced >= 1000) await grantAchievement(userId, 'PROD_1000')
  if (totalProduced >= 10000) await grantAchievement(userId, 'PROD_10000')
  if (totalProduced >= 100000) await grantAchievement(userId, 'PROD_100000')
}

/**
 * Get all achievements with user unlock status.
 */
export async function getUserAchievements(userId: string) {
  const allAchievements = await prisma.achievement.findMany({
    include: {
      rewards: { include: { resource: true } },
      unlocked: { where: { userId } },
    },
    orderBy: { category: 'asc' },
  })

  return allAchievements.map((a: any) => ({
    ...a,
    unlocked: a.unlocked.length > 0,
    unlockedAt: a.unlocked[0]?.unlockedAt ?? null,
    claimed: a.unlocked[0]?.claimed ?? false,
  }))
}
