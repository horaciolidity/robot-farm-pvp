import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, badRequest, ok } from '@/lib/auth'
import { deductResources, addResources } from '@/modules/inventory/inventory.service'
import {
  calculateJobOutput,
  calculateJobDuration,
  calculateJobConsumptions,
  calculateDurabilityLoss,
  calculateJobXP,
} from '@/modules/production/production.calculator'
import { grantAchievement, addXP, checkProductionAchievements } from '@/modules/rewards/rewards.service'
import {
  DURABILITY_BROKEN_THRESHOLD,
  DURABILITY_WARNING_THRESHOLD,
  repairCostPerPoint,
} from '@/modules/upgrades/upgrades.constants'
import { UPGRADE_DEFINITIONS, getNextUpgrade, isMaxUpgrade, UpgradeAttribute } from '@/modules/upgrades/upgrades.constants'

// ── ASSIGN JOB ───────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  const auth = await getAuthUser(req)
  if (!auth) return unauthorized()

  const robot = await prisma.robot.findUnique({
    where: { id: params.id },
    include: {
      robotType: {
        include: {
          producedResource: true,
          consumptions: { include: { resource: true } },
        },
      },
      jobs: {
        where: { status: 'RUNNING' },
        take: 1,
      },
    },
  })

  if (!robot || robot.userId !== auth.sub) return badRequest('Robot not found')

  const action = params.action

  // ── ASSIGN JOB ──────────────────────────────────────────
  if (action === 'assign-job') {
    if (robot.status === 'WORKING') return badRequest('Robot is already working')
    if (robot.durability < DURABILITY_BROKEN_THRESHOLD) {
      return badRequest('Robot needs repair before it can work (durability critical)')
    }
    if (robot.jobs.length > 0) return badRequest('Robot already has an active job')

    // Calculate consumptions
    const consumptions = calculateJobConsumptions(robot as any)

    // Deduct resources
    const result = await deductResources(auth.sub, consumptions)
    if (!result.success) {
      await prisma.robot.update({ where: { id: robot.id }, data: { status: 'NEEDS_RESOURCES' } })
      return badRequest(`Insufficient ${result.missing} to start this job`)
    }

    const durationSecs = calculateJobDuration(robot as any)
    const expectedAmount = calculateJobOutput(robot as any)
    const completesAt = new Date(Date.now() + durationSecs * 1000)

    const job = await prisma.job.create({
      data: {
        userId: auth.sub,
        robotId: robot.id,
        durationSecs,
        completesAt,
        outputResourceId: robot.robotType.producedResourceId,
        expectedAmount,
        consumptions: {
          create: consumptions.map((c: any) => ({
            resourceId: c.resourceId,
            amount: c.amount,
          })),
        },
      },
      include: { outputResource: true, consumptions: { include: { resource: true } } },
    })

    await prisma.robot.update({ where: { id: robot.id }, data: { status: 'WORKING' } })

    // Achievement
    const totalJobs = await prisma.job.count({ where: { userId: auth.sub } })
    if (totalJobs === 1) await grantAchievement(auth.sub, 'FIRST_JOB')

    return ok({
      job,
      message: `${robot.name} started working! Produces ${expectedAmount} ${robot.robotType.producedResource.name} in ${Math.round(durationSecs / 60)}m`,
      completesAt,
    })
  }

  // ── COLLECT ─────────────────────────────────────────────
  if (action === 'collect') {
    const activeJob = await prisma.job.findFirst({
      where: { robotId: robot.id, status: { in: ['RUNNING', 'COMPLETED'] } },
      include: { outputResource: true },
    })

    if (!activeJob) return badRequest('No active job to collect')
    if (new Date() < activeJob.completesAt) {
      const remaining = Math.ceil((activeJob.completesAt.getTime() - Date.now()) / 1000)
      return badRequest(`Job not finished yet. ${remaining}s remaining.`)
    }

    const actualAmount = calculateJobOutput(robot as any)
    const durabilityLoss = calculateDurabilityLoss(robot)
    const xpGained = calculateJobXP(robot)
    const newDurability = Math.max(0, robot.durability - durabilityLoss)
    const newLifetimeWear = Math.min(100, robot.lifetimeWear + durabilityLoss * 0.5)

    // Determine new robot status
    let newStatus: 'IDLE' | 'NEEDS_REPAIR' =
      newDurability < DURABILITY_BROKEN_THRESHOLD ? 'NEEDS_REPAIR' : 'IDLE'

    // Add produced resources to inventory
    await addResources(auth.sub, [{ resourceId: activeJob.outputResourceId, amount: actualAmount }])

    // Update job
    await prisma.job.update({
      where: { id: activeJob.id },
      data: {
        status: 'COLLECTED',
        actualAmount,
        completedAt: new Date(),
        collected: true,
        collectedAt: new Date(),
      },
    })

    // Update robot
    await prisma.robot.update({
      where: { id: robot.id },
      data: {
        status: newStatus,
        durability: newDurability,
        lifetimeWear: newLifetimeWear,
        experience: { increment: xpGained },
      },
    })

    // Update avatar stats
    const avatar = await prisma.avatar.update({
      where: { userId: auth.sub },
      data: {
        totalProduced: { increment: actualAmount },
        totalJobs: { increment: 1 },
      },
    })

    await addXP(auth.sub, xpGained)

    // Check achievements
    await grantAchievement(auth.sub, 'FIRST_COLLECT')
    await checkProductionAchievements(auth.sub, avatar.totalProduced + actualAmount)

    return ok({
      collected: {
        resource: activeJob.outputResource.name,
        amount: actualAmount,
        icon: activeJob.outputResource.icon,
      },
      robotUpdate: {
        newDurability,
        durabilityLoss,
        needsRepair: newStatus === 'NEEDS_REPAIR',
      },
      xpGained,
      message: `+${actualAmount.toFixed(1)} ${activeJob.outputResource.name} collected!`,
    })
  }

  // ── REPAIR ──────────────────────────────────────────────
  if (action === 'repair') {
    if (robot.durability >= 100) return badRequest('Robot is already at full durability')

    const pointsToRepair = Math.ceil(100 - robot.durability)
    const costPerPoint = repairCostPerPoint(robot.level)

    // Resolve resourceIds for repair costs
    const resourceKeys = costPerPoint.map((c: any) => c.resourceKey)
    const resources = await prisma.resource.findMany({ where: { key: { in: resourceKeys } } })
    const resourceMap = Object.fromEntries(resources.map((r: any) => [r.key, r]))

    const deductions = costPerPoint.map((c: any) => ({
      resourceId: resourceMap[c.resourceKey].id,
      amount: c.amount * pointsToRepair,
    }))

    const result = await deductResources(auth.sub, deductions)
    if (!result.success) {
      return badRequest(`Insufficient ${result.missing} for repair`)
    }

    await prisma.robot.update({
      where: { id: robot.id },
      data: { durability: 100, status: 'IDLE' },
    })

    await grantAchievement(auth.sub, 'FIRST_REPAIR')

    return ok({
      message: `${robot.name} repaired to 100% durability`,
      cost: deductions,
    })
  }

  // ── UPGRADE ─────────────────────────────────────────────
  if (action === 'upgrade') {
    const body = await req.json().catch(() => ({}))
    const { attribute } = body as { attribute: UpgradeAttribute }

    const validAttributes: UpgradeAttribute[] = ['PRODUCTION', 'EFFICIENCY', 'ENERGY_CAPACITY', 'DURABILITY', 'SPEED']
    if (!validAttributes.includes(attribute)) return badRequest('Invalid upgrade attribute')

    const attributeToField: Record<UpgradeAttribute, keyof typeof robot> = {
      PRODUCTION: 'upgradeProduction',
      EFFICIENCY: 'upgradeEfficiency',
      ENERGY_CAPACITY: 'upgradeEnergyCapacity',
      DURABILITY: 'upgradeDurability',
      SPEED: 'upgradeSpeed',
    }

    const currentLevel = robot[attributeToField[attribute]] as number
    if (isMaxUpgrade(attribute, currentLevel)) return badRequest('Already at max upgrade level')

    const nextUpgrade = getNextUpgrade(attribute, currentLevel)
    if (!nextUpgrade) return badRequest('No upgrade available')

    // Resolve resources
    const resourceKeys = nextUpgrade.cost.map((c: any) => c.resourceKey)
    const resources = await prisma.resource.findMany({ where: { key: { in: resourceKeys } } })
    const resourceMap = Object.fromEntries(resources.map((r: any) => [r.key, r]))

    const deductions = nextUpgrade.cost.map((c: any) => ({
      resourceId: resourceMap[c.resourceKey].id,
      amount: c.amount,
    }))

    if (deductions.length > 0) {
      const result = await deductResources(auth.sub, deductions)
      if (!result.success) {
        return badRequest(`Insufficient ${result.missing} for this upgrade`)
      }
    }

    const updateData: Record<string, number> = {
      [attributeToField[attribute]]: nextUpgrade.level,
    }

    const updatedRobot = await prisma.robot.update({
      where: { id: robot.id },
      data: updateData,
    })

    await prisma.avatar.update({
      where: { userId: auth.sub },
      data: { totalUpgrades: { increment: 1 } },
    })

    await grantAchievement(auth.sub, 'FIRST_UPGRADE')

    return ok({
      robot: updatedRobot,
      attribute,
      newLevel: nextUpgrade.level,
      newValue: nextUpgrade.value,
      message: `${robot.name} — ${attribute} upgraded to level ${nextUpgrade.level}!`,
    })
  }

  return badRequest('Unknown action')
}
