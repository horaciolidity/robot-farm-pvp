// ============================================================
// UPGRADE CONSTANTS
// All upgrade costs and multipliers are defined here.
// This is the single source of truth for upgrade logic.
// ============================================================

export type UpgradeAttribute = 'PRODUCTION' | 'EFFICIENCY' | 'ENERGY_CAPACITY' | 'DURABILITY' | 'SPEED'

export interface UpgradeCostEntry {
  resourceKey: string
  amount: number
}

export interface UpgradeLevel {
  level: number
  // For PRODUCTION: multiplier on base output
  // For EFFICIENCY: fraction of consumption saved (0.1 = 10% less consumption)
  // For ENERGY_CAPACITY: bonus energy capacity (unused in MVP, reserved)
  // For DURABILITY: fraction of durability loss saved (0.1 = 10% less wear)
  // For SPEED: fraction of duration reduced (0.1 = 10% faster)
  value: number
  cost: UpgradeCostEntry[]
}

export const UPGRADE_DEFINITIONS: Record<UpgradeAttribute, UpgradeLevel[]> = {
  PRODUCTION: [
    { level: 0, value: 1.0,  cost: [] },
    { level: 1, value: 1.4,  cost: [{ resourceKey: 'IRON', amount: 50 }, { resourceKey: 'ENERGY', amount: 20 }] },
    { level: 2, value: 2.0,  cost: [{ resourceKey: 'IRON', amount: 150 }, { resourceKey: 'COPPER', amount: 50 }, { resourceKey: 'ENERGY', amount: 20 }] },
    { level: 3, value: 2.8,  cost: [{ resourceKey: 'IRON', amount: 500 }, { resourceKey: 'COPPER', amount: 100 }, { resourceKey: 'SILICON', amount: 50 }] },
    { level: 4, value: 4.0,  cost: [{ resourceKey: 'IRON', amount: 2000 }, { resourceKey: 'COPPER', amount: 500 }, { resourceKey: 'SILICON', amount: 200 }, { resourceKey: 'TITANIUM', amount: 10 }] },
  ],
  EFFICIENCY: [
    { level: 0, value: 0,    cost: [] },
    { level: 1, value: 0.10, cost: [{ resourceKey: 'COPPER', amount: 30 }, { resourceKey: 'ENERGY', amount: 15 }] },
    { level: 2, value: 0.20, cost: [{ resourceKey: 'COPPER', amount: 100 }, { resourceKey: 'SILICON', amount: 20 }] },
    { level: 3, value: 0.35, cost: [{ resourceKey: 'COPPER', amount: 300 }, { resourceKey: 'SILICON', amount: 80 }, { resourceKey: 'TITANIUM', amount: 5 }] },
    { level: 4, value: 0.50, cost: [{ resourceKey: 'SILICON', amount: 500 }, { resourceKey: 'TITANIUM', amount: 30 }] },
  ],
  ENERGY_CAPACITY: [
    { level: 0, value: 0,    cost: [] },
    { level: 1, value: 0.20, cost: [{ resourceKey: 'IRON', amount: 40 }, { resourceKey: 'COPPER', amount: 20 }] },
    { level: 2, value: 0.40, cost: [{ resourceKey: 'IRON', amount: 120 }, { resourceKey: 'COPPER', amount: 60 }, { resourceKey: 'SILICON', amount: 10 }] },
    { level: 3, value: 0.60, cost: [{ resourceKey: 'COPPER', amount: 200 }, { resourceKey: 'SILICON', amount: 40 }] },
  ],
  DURABILITY: [
    { level: 0, value: 0,    cost: [] },
    { level: 1, value: 0.15, cost: [{ resourceKey: 'IRON', amount: 80 }, { resourceKey: 'MAINTENANCE', amount: 5 }] },
    { level: 2, value: 0.30, cost: [{ resourceKey: 'IRON', amount: 250 }, { resourceKey: 'COPPER', amount: 80 }, { resourceKey: 'MAINTENANCE', amount: 10 }] },
    { level: 3, value: 0.50, cost: [{ resourceKey: 'IRON', amount: 800 }, { resourceKey: 'COPPER', amount: 200 }, { resourceKey: 'TITANIUM', amount: 8 }] },
  ],
  SPEED: [
    { level: 0, value: 0,    cost: [] },
    { level: 1, value: 0.15, cost: [{ resourceKey: 'SILICON', amount: 30 }, { resourceKey: 'ENERGY', amount: 30 }] },
    { level: 2, value: 0.30, cost: [{ resourceKey: 'SILICON', amount: 100 }, { resourceKey: 'COPPER', amount: 100 }, { resourceKey: 'ENERGY', amount: 50 }] },
    { level: 3, value: 0.45, cost: [{ resourceKey: 'SILICON', amount: 300 }, { resourceKey: 'TITANIUM', amount: 15 }] },
  ],
}

export function getUpgradeLevel(attribute: UpgradeAttribute, currentLevel: number): UpgradeLevel {
  return UPGRADE_DEFINITIONS[attribute][currentLevel] ?? UPGRADE_DEFINITIONS[attribute][0]
}

export function getNextUpgrade(attribute: UpgradeAttribute, currentLevel: number): UpgradeLevel | null {
  const levels = UPGRADE_DEFINITIONS[attribute]
  const next = levels.find(l => l.level === currentLevel + 1)
  return next ?? null
}

export function isMaxUpgrade(attribute: UpgradeAttribute, currentLevel: number): boolean {
  const levels = UPGRADE_DEFINITIONS[attribute]
  return currentLevel >= levels[levels.length - 1].level
}

// ── REPAIR COSTS ─────────────────────────────────────────────
// Cost to repair 1 point of durability scales with robot level
export function repairCostPerPoint(robotLevel: number): UpgradeCostEntry[] {
  const ironCost = 2 + robotLevel * 1
  const copperCost = robotLevel > 2 ? robotLevel * 0.5 : 0
  return [
    { resourceKey: 'IRON', amount: ironCost },
    ...(copperCost > 0 ? [{ resourceKey: 'COPPER', amount: copperCost }] : []),
    { resourceKey: 'MAINTENANCE', amount: 1 },
  ]
}

// ── DURABILITY CONSTANTS ─────────────────────────────────────
export const DURABILITY_LOSS_PER_JOB = 4      // base points lost per completed job
export const DURABILITY_WARNING_THRESHOLD = 30  // show warning below this
export const DURABILITY_BROKEN_THRESHOLD = 10   // robot can't work below this

// ── XP CONSTANTS ─────────────────────────────────────────────
export const XP_PER_JOB = 25
export const XP_PER_UPGRADE = 50
export const XP_PER_REPAIR = 10

// ── STARTER PACK ─────────────────────────────────────────────
export const STARTER_RESOURCES: Record<string, number> = {
  IRON: 500,
  ENERGY: 200,
  COPPER: 100,
  MAINTENANCE: 20,
  SILICON: 10,
}
