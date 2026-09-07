import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── RESOURCES ────────────────────────────────────────────
  const resources = await Promise.all([
    prisma.resource.upsert({
      where: { key: 'IRON' },
      update: {},
      create: {
        key: 'IRON', name: 'Iron', symbol: 'FE',
        description: 'Basic metal. Used for upgrades, construction and robot repairs.',
        category: 'BASIC', color: '#9ca3af', icon: '🔩',
        basePrice: 0.002, currentPrice: 0.002,
      },
    }),
    prisma.resource.upsert({
      where: { key: 'COPPER' },
      update: {},
      create: {
        key: 'COPPER', name: 'Copper', symbol: 'CU',
        description: 'Conductive metal. Required for electronics and advanced upgrades.',
        category: 'BASIC', color: '#f97316', icon: '🔶',
        basePrice: 0.008, currentPrice: 0.008,
      },
    }),
    prisma.resource.upsert({
      where: { key: 'SILICON' },
      update: {},
      create: {
        key: 'SILICON', name: 'Silicon', symbol: 'SI',
        description: 'Core of all computing. Required for intelligence upgrades and tech robots.',
        category: 'ADVANCED', color: '#818cf8', icon: '💠',
        basePrice: 0.025, currentPrice: 0.025,
      },
    }),
    prisma.resource.upsert({
      where: { key: 'ENERGY' },
      update: {},
      create: {
        key: 'ENERGY', name: 'Energy', symbol: 'NRG',
        description: 'Powers all robot operations. Consumed every job.',
        category: 'ENERGY', color: '#facc15', icon: '⚡',
        basePrice: 0.005, currentPrice: 0.005,
      },
    }),
    prisma.resource.upsert({
      where: { key: 'TITANIUM' },
      update: {},
      create: {
        key: 'TITANIUM', name: 'Titanium', symbol: 'TI',
        description: 'Ultra-rare metal. Required for advanced robots and combat.',
        category: 'RARE', color: '#38bdf8', icon: '🔷',
        basePrice: 0.15, currentPrice: 0.15,
      },
    }),
    prisma.resource.upsert({
      where: { key: 'FOOD' },
      update: {},
      create: {
        key: 'FOOD', name: 'Food', symbol: 'FD',
        description: 'Bio-nutrients. Consumed by Worker and Farmer robots.',
        category: 'CONSUMABLE', color: '#4ade80', icon: '🌿',
        basePrice: 0.003, currentPrice: 0.003,
      },
    }),
    prisma.resource.upsert({
      where: { key: 'MAINTENANCE' },
      update: {},
      create: {
        key: 'MAINTENANCE', name: 'Maintenance Kit', symbol: 'MK',
        description: 'Spare parts and tools. Keeps robots running smoothly.',
        category: 'CONSUMABLE', color: '#a78bfa', icon: '🔧',
        basePrice: 0.012, currentPrice: 0.012,
      },
    }),
  ])

  const resourceMap = Object.fromEntries(resources.map(r => [r.key, r]))

  // ── ROBOT TYPES ──────────────────────────────────────────

  // MINER
  const miner = await prisma.robotType.upsert({
    where: { key: 'MINER' },
    update: {},
    create: {
      key: 'MINER', name: 'Miner Robot', imageId: 'miner_01',
      description: 'Extracts raw Iron from underground deposits. Reliable workhorse.',
      category: 'PRODUCTIVE',
      baseOutputAmount: 10,
      producedResourceId: resourceMap['IRON'].id,
      baseDurationSecs: 3600, // 60 min
      requiredAvatarLevel: 1, isLocked: false,
    },
  })
  await prisma.robotTypeConsumption.deleteMany({ where: { robotTypeId: miner.id } })
  await prisma.robotTypeConsumption.createMany({
    data: [
      { robotTypeId: miner.id, resourceId: resourceMap['ENERGY'].id, amountPerJob: 3 },
      { robotTypeId: miner.id, resourceId: resourceMap['MAINTENANCE'].id, amountPerJob: 1 },
    ],
  })
  // Miner is free (starter robot)
  await prisma.robotTypeAcquisitionCost.deleteMany({ where: { robotTypeId: miner.id } })

  // FARMER
  const farmer = await prisma.robotType.upsert({
    where: { key: 'FARMER' },
    update: {},
    create: {
      key: 'FARMER', name: 'Farmer Robot', imageId: 'farmer_01',
      description: 'Cultivates bio-nutrients. Produces Food consumed by other robots.',
      category: 'PRODUCTIVE',
      baseOutputAmount: 15,
      producedResourceId: resourceMap['FOOD'].id,
      baseDurationSecs: 2700, // 45 min
      requiredAvatarLevel: 1, isLocked: false,
    },
  })
  await prisma.robotTypeConsumption.deleteMany({ where: { robotTypeId: farmer.id } })
  await prisma.robotTypeConsumption.createMany({
    data: [
      { robotTypeId: farmer.id, resourceId: resourceMap['ENERGY'].id, amountPerJob: 2 },
      { robotTypeId: farmer.id, resourceId: resourceMap['MAINTENANCE'].id, amountPerJob: 1 },
    ],
  })
  await prisma.robotTypeAcquisitionCost.deleteMany({ where: { robotTypeId: farmer.id } })
  await prisma.robotTypeAcquisitionCost.createMany({
    data: [
      { robotTypeId: farmer.id, resourceId: resourceMap['IRON'].id, amount: 200 },
      { robotTypeId: farmer.id, resourceId: resourceMap['ENERGY'].id, amount: 50 },
    ],
  })

  // COLLECTOR (Copper)
  const collector = await prisma.robotType.upsert({
    where: { key: 'COLLECTOR' },
    update: {},
    create: {
      key: 'COLLECTOR', name: 'Collector Robot', imageId: 'collector_01',
      description: 'Gathers Copper from surface deposits. Slower but valuable output.',
      category: 'PRODUCTIVE',
      baseOutputAmount: 8,
      producedResourceId: resourceMap['COPPER'].id,
      baseDurationSecs: 5400, // 90 min
      requiredAvatarLevel: 2, isLocked: false,
    },
  })
  await prisma.robotTypeConsumption.deleteMany({ where: { robotTypeId: collector.id } })
  await prisma.robotTypeConsumption.createMany({
    data: [
      { robotTypeId: collector.id, resourceId: resourceMap['ENERGY'].id, amountPerJob: 4 },
      { robotTypeId: collector.id, resourceId: resourceMap['MAINTENANCE'].id, amountPerJob: 2 },
    ],
  })
  await prisma.robotTypeAcquisitionCost.deleteMany({ where: { robotTypeId: collector.id } })
  await prisma.robotTypeAcquisitionCost.createMany({
    data: [
      { robotTypeId: collector.id, resourceId: resourceMap['IRON'].id, amount: 500 },
      { robotTypeId: collector.id, resourceId: resourceMap['COPPER'].id, amount: 50 },
      { robotTypeId: collector.id, resourceId: resourceMap['ENERGY'].id, amount: 100 },
    ],
  })

  // WORKER (Silicon)
  const worker = await prisma.robotType.upsert({
    where: { key: 'WORKER' },
    update: {},
    create: {
      key: 'WORKER', name: 'Worker Robot', imageId: 'worker_01',
      description: 'Processes Silicon wafers. High-value output for advanced tech.',
      category: 'PRODUCTIVE',
      baseOutputAmount: 5,
      producedResourceId: resourceMap['SILICON'].id,
      baseDurationSecs: 7200, // 120 min
      requiredAvatarLevel: 3, isLocked: false,
    },
  })
  await prisma.robotTypeConsumption.deleteMany({ where: { robotTypeId: worker.id } })
  await prisma.robotTypeConsumption.createMany({
    data: [
      { robotTypeId: worker.id, resourceId: resourceMap['ENERGY'].id, amountPerJob: 5 },
      { robotTypeId: worker.id, resourceId: resourceMap['MAINTENANCE'].id, amountPerJob: 2 },
      { robotTypeId: worker.id, resourceId: resourceMap['FOOD'].id, amountPerJob: 3 },
    ],
  })
  await prisma.robotTypeAcquisitionCost.deleteMany({ where: { robotTypeId: worker.id } })
  await prisma.robotTypeAcquisitionCost.createMany({
    data: [
      { robotTypeId: worker.id, resourceId: resourceMap['IRON'].id, amount: 1000 },
      { robotTypeId: worker.id, resourceId: resourceMap['COPPER'].id, amount: 200 },
      { robotTypeId: worker.id, resourceId: resourceMap['SILICON'].id, amount: 10 },
      { robotTypeId: worker.id, resourceId: resourceMap['ENERGY'].id, amount: 200 },
    ],
  })

  // COMBAT ROBOT (locked)
  const combatRobot = await prisma.robotType.upsert({
    where: { key: 'COMBAT' },
    update: {},
    create: {
      key: 'COMBAT', name: 'Combat Robot', imageId: 'combat_01',
      description: 'Elite battle machine. Unlocked only by the most advanced operators.',
      category: 'COMBAT',
      baseOutputAmount: 0,
      producedResourceId: resourceMap['TITANIUM'].id, // placeholder
      baseDurationSecs: 0,
      requiredAvatarLevel: 20, isLocked: true,
      unlockRequirements: {
        robotSlots: 8,
        totalProduced: 1000000,
        titanium: 5000,
        level: 20,
        advancedComponents: 50,
      },
    },
  })

  // ── EXPANSION TIERS ─────────────────────────────────────
  const expansions = [
    { tier: 1, slotsGranted: 4, costs: [{ key: 'IRON', amount: 1000 }, { key: 'COPPER', amount: 500 }, { key: 'SILICON', amount: 100 }] },
    { tier: 2, slotsGranted: 6, costs: [{ key: 'IRON', amount: 5000 }, { key: 'COPPER', amount: 2000 }, { key: 'SILICON', amount: 500 }, { key: 'TITANIUM', amount: 50 }] },
    { tier: 3, slotsGranted: 8, costs: [{ key: 'IRON', amount: 20000 }, { key: 'COPPER', amount: 8000 }, { key: 'SILICON', amount: 2000 }, { key: 'TITANIUM', amount: 500 }] },
    { tier: 4, slotsGranted: 10, costs: [{ key: 'IRON', amount: 100000 }, { key: 'COPPER', amount: 30000 }, { key: 'SILICON', amount: 10000 }, { key: 'TITANIUM', amount: 5000 }] },
  ]

  for (const exp of expansions) {
    const tier = await prisma.expansionTier.upsert({
      where: { tier: exp.tier },
      update: {},
      create: { tier: exp.tier, slotsGranted: exp.slotsGranted },
    })
    await prisma.expansionCost.deleteMany({ where: { expansionTierId: tier.id } })
    await prisma.expansionCost.createMany({
      data: exp.costs.map(c => ({
        expansionTierId: tier.id,
        resourceId: resourceMap[c.key].id,
        amount: c.amount,
      })),
    })
  }

  // ── ACHIEVEMENTS ─────────────────────────────────────────
  const achievements = [
    { key: 'FIRST_ROBOT', title: 'First Contact', description: 'Acquire your first robot.', icon: '🤖', category: 'GENERAL', xpReward: 50, rewards: [] },
    { key: 'FIRST_JOB', title: 'Put to Work', description: 'Assign your robot to its first job.', icon: '⚙️', category: 'GENERAL', xpReward: 50, rewards: [{ key: 'ENERGY', amount: 20 }] },
    { key: 'FIRST_COLLECT', title: 'First Harvest', description: 'Collect your first job output.', icon: '📦', category: 'PRODUCTION', xpReward: 100, rewards: [{ key: 'IRON', amount: 50 }] },
    { key: 'FIRST_UPGRADE', title: 'Enhanced', description: 'Apply your first robot upgrade.', icon: '⬆️', category: 'GENERAL', xpReward: 150, rewards: [{ key: 'MAINTENANCE', amount: 5 }] },
    { key: 'FIRST_REPAIR', title: 'Field Mechanic', description: 'Repair a robot for the first time.', icon: '🔧', category: 'GENERAL', xpReward: 75, rewards: [] },
    { key: 'SECOND_ROBOT', title: 'Full House', description: 'Own 2 robots simultaneously.', icon: '🤝', category: 'GENERAL', xpReward: 200, rewards: [{ key: 'ENERGY', amount: 50 }] },
    { key: 'FIRST_EXPANSION', title: 'Growing Empire', description: 'Unlock your first capacity expansion.', icon: '🏗️', category: 'GENERAL', xpReward: 500, rewards: [{ key: 'IRON', amount: 500 }, { key: 'COPPER', amount: 100 }] },
    { key: 'PROD_1000', title: 'Industrial Starter', description: 'Produce 1,000 total resources.', icon: '🏭', category: 'PRODUCTION', xpReward: 300, rewards: [{ key: 'MAINTENANCE', amount: 10 }] },
    { key: 'PROD_10000', title: 'Factory Owner', description: 'Produce 10,000 total resources.', icon: '🌆', category: 'PRODUCTION', xpReward: 1000, rewards: [{ key: 'COPPER', amount: 200 }] },
    { key: 'PROD_100000', title: 'Industrial Giant', description: 'Produce 100,000 total resources.', icon: '🌇', category: 'PRODUCTION', xpReward: 5000, rewards: [{ key: 'SILICON', amount: 50 }] },
    { key: 'FULL_CAPACITY', title: 'Maximum Capacity', description: 'Fill all robot slots.', icon: '💯', category: 'GENERAL', xpReward: 250, rewards: [{ key: 'ENERGY', amount: 100 }] },
    { key: 'MARKET_SELL', title: 'First Trade', description: 'Sell resources on the market.', icon: '📊', category: 'ECONOMY', xpReward: 100, rewards: [] },
    { key: 'LEVEL_5', title: 'Operator', description: 'Reach avatar level 5.', icon: '⭐', category: 'GENERAL', xpReward: 200, rewards: [{ key: 'MAINTENANCE', amount: 20 }] },
    { key: 'LEVEL_10', title: 'Senior Operator', description: 'Reach avatar level 10.', icon: '🌟', category: 'GENERAL', xpReward: 500, rewards: [{ key: 'TITANIUM', amount: 10 }] },
  ]

  for (const ach of achievements) {
    const created = await prisma.achievement.upsert({
      where: { key: ach.key },
      update: {},
      create: {
        key: ach.key, title: ach.title, description: ach.description,
        icon: ach.icon, category: ach.category, xpReward: ach.xpReward,
      },
    })
    if (ach.rewards.length > 0) {
      await prisma.achievementReward.deleteMany({ where: { achievementId: created.id } })
      await prisma.achievementReward.createMany({
        data: ach.rewards.map(r => ({
          achievementId: created.id,
          resourceId: resourceMap[r.key].id,
          amount: r.amount,
        })),
      })
    }
  }

  console.log('✅ Seed complete!')
  console.log(`   Resources: ${resources.length}`)
  console.log(`   Robot Types: 5 (Miner, Farmer, Collector, Worker, Combat[locked])`)
  console.log(`   Expansion Tiers: ${expansions.length}`)
  console.log(`   Achievements: ${achievements.length}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
