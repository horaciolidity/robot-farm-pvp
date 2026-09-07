import { Robot, RobotType } from '@prisma/client'
import {
  UPGRADE_DEFINITIONS,
  DURABILITY_LOSS_PER_JOB,
  UpgradeAttribute,
} from '../upgrades/upgrades.constants'

// ============================================================
// PRODUCTION CALCULATOR
// All production math lives here — no business logic in API routes
// ============================================================

export type RobotWithType = Robot & { robotType: RobotType }

/**
 * Calculate the actual output amount for a completed job.
 * Applies production upgrade multiplier.
 */
export function calculateJobOutput(robot: RobotWithType): number {
  const prodMultiplier = UPGRADE_DEFINITIONS.PRODUCTION[robot.upgradeProduction]?.value ?? 1.0
  return robot.robotType.baseOutputAmount * prodMultiplier
}

/**
 * Calculate job duration in seconds.
 * Applies speed upgrade reduction.
 */
export function calculateJobDuration(robot: RobotWithType): number {
  const speedReduction = UPGRADE_DEFINITIONS.SPEED[robot.upgradeSpeed]?.value ?? 0
  const base = robot.robotType.baseDurationSecs
  return Math.max(60, Math.floor(base * (1 - speedReduction)))
}

/**
 * Calculate resource consumptions for a job.
 * Applies efficiency upgrade to reduce costs.
 */
export function calculateJobConsumptions(
  robot: RobotWithType & { robotType: RobotType & { consumptions: { resourceId: string; amountPerJob: number }[] } }
): { resourceId: string; amount: number }[] {
  const efficiencySaving = UPGRADE_DEFINITIONS.EFFICIENCY[robot.upgradeEfficiency]?.value ?? 0
  const multiplier = 1 - efficiencySaving

  return robot.robotType.consumptions.map(c => ({
    resourceId: c.resourceId,
    amount: Math.max(0, c.amountPerJob * multiplier),
  }))
}

/**
 * Calculate durability loss per job.
 * Applies durability upgrade to reduce wear.
 */
export function calculateDurabilityLoss(robot: Robot): number {
  const durabilitySaving = UPGRADE_DEFINITIONS.DURABILITY[robot.upgradeDurability]?.value ?? 0
  return Math.max(1, DURABILITY_LOSS_PER_JOB * (1 - durabilitySaving))
}

/**
 * Calculate XP gained per completed job (scales with robot level).
 */
export function calculateJobXP(robot: Robot): number {
  return 25 + robot.level * 5
}

/**
 * Get the current production rate for display (output per hour).
 */
export function getProductionRatePerHour(robot: RobotWithType): number {
  const output = calculateJobOutput(robot)
  const durationSecs = calculateJobDuration(robot)
  return (output / durationSecs) * 3600
}

/**
 * Get net production value after resource costs (in USDC equivalent).
 */
export function getNetProductionValue(
  robot: RobotWithType & { robotType: RobotType & { consumptions: { resourceId: string; amountPerJob: number; resource: { currentPrice: number } }[]; producedResource: { currentPrice: number } } }
): { gross: number; cost: number; net: number } {
  const output = calculateJobOutput(robot)
  const gross = output * robot.robotType.producedResource.currentPrice

  const consumptions = calculateJobConsumptions(robot as any)
  const cost = consumptions.reduce((sum, c) => {
    const match = robot.robotType.consumptions.find(tc => tc.resourceId === c.resourceId)
    return sum + (match ? c.amount * (match as any).resource.currentPrice : 0)
  }, 0)

  return { gross, cost, net: gross - cost }
}
