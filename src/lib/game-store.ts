// ============================================================
// LOCAL GAME STORE — todo el estado del juego en localStorage
// ============================================================

// ---- TIPOS ----
export interface Avatar {
  id: string
  userId: string
  name: string
  avatarType: 'ENGINEER' | 'COMMANDER' | 'HACKER' | 'MERCHANT'
  level: number
  experience: number
  totalXP: number
  robotSlots: number
  expansionLevel: number
  totalProduced: number
  totalJobs: number
  totalUpgrades: number
  createdAt: string
}

export interface Inventory {
  [resourceKey: string]: number
}

export interface Robot {
  id: string
  userId: string
  name: string
  robotTypeKey: string
  status: 'IDLE' | 'WORKING' | 'NEEDS_REPAIR' | 'NEEDS_RESOURCES' | 'RETIRED'
  level: number
  experience: number
  durability: number
  lifetimeWear: number
  upgradeProduction: number
  upgradeEfficiency: number
  upgradeEnergyCapacity: number
  upgradeDurability: number
  upgradeSpeed: number
  createdAt: string
}

export interface ActiveJob {
  id: string
  robotId: string
  userId: string
  startedAt: string
  completesAt: string
  durationSecs: number
  resourceKey: string   // recurso que produce
  expectedAmount: number
  status: 'RUNNING' | 'COMPLETED' | 'COLLECTED'
}

// ---- TIPOS DE ROBOTS (estáticos) ----
export const ROBOT_TYPES = [
  {
    key: 'MINER',
    name: 'Mining Bot',
    description: 'Extracts iron ore from underground deposits.',
    icon: '⛏️',
    baseOutputAmount: 10,
    producedResourceKey: 'IRON',
    baseDurationSecs: 60,
    consumptions: [{ resourceKey: 'ENERGY', amountPerJob: 5 }],
    acquisitionCosts: [] as { resourceKey: string; amount: number }[],
    isLocked: false,
    requiredLevel: 1,
  },
  {
    key: 'FARMER',
    name: 'Farming Bot',
    description: 'Grows food in vertical hydroponic farms.',
    icon: '🌾',
    baseOutputAmount: 15,
    producedResourceKey: 'FOOD',
    baseDurationSecs: 90,
    consumptions: [{ resourceKey: 'ENERGY', amountPerJob: 3 }, { resourceKey: 'IRON', amountPerJob: 1 }],
    acquisitionCosts: [{ resourceKey: 'IRON', amount: 200 }, { resourceKey: 'ENERGY', amount: 100 }],
    isLocked: false,
    requiredLevel: 1,
  },
  {
    key: 'COLLECTOR',
    name: 'Collector Bot',
    description: 'Gathers copper and rare minerals from the surface.',
    icon: '🔍',
    baseOutputAmount: 8,
    producedResourceKey: 'COPPER',
    baseDurationSecs: 75,
    consumptions: [{ resourceKey: 'ENERGY', amountPerJob: 4 }, { resourceKey: 'FOOD', amountPerJob: 2 }],
    acquisitionCosts: [{ resourceKey: 'IRON', amount: 300 }, { resourceKey: 'COPPER', amount: 100 }],
    isLocked: false,
    requiredLevel: 1,
  },
  {
    key: 'WORKER',
    name: 'Silicon Bot',
    description: 'Processes raw materials into refined silicon.',
    icon: '🔬',
    baseOutputAmount: 6,
    producedResourceKey: 'SILICON',
    baseDurationSecs: 120,
    consumptions: [{ resourceKey: 'ENERGY', amountPerJob: 8 }, { resourceKey: 'IRON', amountPerJob: 3 }],
    acquisitionCosts: [{ resourceKey: 'IRON', amount: 500 }, { resourceKey: 'COPPER', amount: 200 }, { resourceKey: 'SILICON', amount: 50 }],
    isLocked: false,
    requiredLevel: 2,
  },
  {
    key: 'COMBAT',
    name: 'Combat Bot',
    description: 'Elite combat unit for PvP battles. Unlock via combat system.',
    icon: '⚔️',
    baseOutputAmount: 0,
    producedResourceKey: 'TITANIUM',
    baseDurationSecs: 300,
    consumptions: [],
    acquisitionCosts: [{ resourceKey: 'TITANIUM', amount: 1000 }],
    isLocked: true,
    requiredLevel: 10,
  },
]

export const RESOURCE_META: Record<string, { name: string; icon: string; color: string; basePrice: number }> = {
  IRON:        { name: 'Iron',        icon: '🔩', color: 'var(--res-iron)',     basePrice: 0.001 },
  COPPER:      { name: 'Copper',      icon: '🔶', color: 'var(--res-copper)',   basePrice: 0.002 },
  SILICON:     { name: 'Silicon',     icon: '💠', color: 'var(--res-silicon)',  basePrice: 0.005 },
  ENERGY:      { name: 'Energy',      icon: '⚡', color: 'var(--res-energy)',   basePrice: 0.0008 },
  TITANIUM:    { name: 'Titanium',    icon: '🔷', color: 'var(--res-titanium)', basePrice: 0.02 },
  FOOD:        { name: 'Food',        icon: '🌽', color: '#86efac',             basePrice: 0.0005 },
  MAINTENANCE: { name: 'Maintenance', icon: '🔧', color: '#fbbf24',            basePrice: 0.003 },
}

// ---- STORAGE KEYS ----
function userId(): string {
  const u = localStorage.getItem('rf_user')
  if (!u) return ''
  return JSON.parse(u).id
}

const KEY = {
  avatar:    () => `rf_avatar_${userId()}`,
  robots:    () => `rf_robots_${userId()}`,
  inventory: () => `rf_inventory_${userId()}`,
  jobs:      () => `rf_jobs_${userId()}`,
}

// ---- AVATAR ----
export function getAvatar(): Avatar | null {
  try { return JSON.parse(localStorage.getItem(KEY.avatar()) ?? 'null') } catch { return null }
}
export function saveAvatar(a: Avatar) {
  localStorage.setItem(KEY.avatar(), JSON.stringify(a))
}

// ---- INVENTORY ----
export function getInventory(): Inventory {
  try { return JSON.parse(localStorage.getItem(KEY.inventory()) ?? '{}') } catch { return {} }
}
export function saveInventory(inv: Inventory) {
  localStorage.setItem(KEY.inventory(), JSON.stringify(inv))
}
export function addInventory(resourceKey: string, amount: number) {
  const inv = getInventory()
  inv[resourceKey] = (inv[resourceKey] ?? 0) + amount
  saveInventory(inv)
}
export function deductInventory(resourceKey: string, amount: number): boolean {
  const inv = getInventory()
  if ((inv[resourceKey] ?? 0) < amount) return false
  inv[resourceKey] = (inv[resourceKey] ?? 0) - amount
  saveInventory(inv)
  return true
}

// ---- ROBOTS ----
export function getRobots(): Robot[] {
  try { return JSON.parse(localStorage.getItem(KEY.robots()) ?? '[]') } catch { return [] }
}
export function saveRobots(robots: Robot[]) {
  localStorage.setItem(KEY.robots(), JSON.stringify(robots))
}
export function updateRobot(robotId: string, changes: Partial<Robot>) {
  const robots = getRobots()
  const idx = robots.findIndex((r: Robot) => r.id === robotId)
  if (idx >= 0) { robots[idx] = { ...robots[idx], ...changes }; saveRobots(robots) }
}
export function acquireRobot(typeKey: string): { ok: boolean; error?: string; robot?: Robot } {
  const avatar = getAvatar()
  if (!avatar) return { ok: false, error: 'No avatar found' }
  const robots = getRobots()
  if (robots.filter((r: Robot) => r.status !== 'RETIRED').length >= avatar.robotSlots) {
    return { ok: false, error: 'Robot slots full. Expand first.' }
  }
  const type = ROBOT_TYPES.find(t => t.key === typeKey)
  if (!type) return { ok: false, error: 'Unknown robot type' }
  const inv = getInventory()
  for (const cost of type.acquisitionCosts) {
    if ((inv[cost.resourceKey] ?? 0) < cost.amount) {
      return { ok: false, error: `Not enough ${RESOURCE_META[cost.resourceKey]?.name ?? cost.resourceKey}` }
    }
  }
  for (const cost of type.acquisitionCosts) {
    inv[cost.resourceKey] = (inv[cost.resourceKey] ?? 0) - cost.amount
  }
  saveInventory(inv)
  const robot: Robot = {
    id: `robot_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId: userId(),
    name: `${type.name} #${robots.length + 1}`,
    robotTypeKey: typeKey,
    status: 'IDLE',
    level: 1,
    experience: 0,
    durability: 100,
    lifetimeWear: 0,
    upgradeProduction: 0,
    upgradeEfficiency: 0,
    upgradeEnergyCapacity: 0,
    upgradeDurability: 0,
    upgradeSpeed: 0,
    createdAt: new Date().toISOString(),
  }
  saveRobots([...robots, robot])
  return { ok: true, robot }
}

// ---- JOBS ----
export function getJobs(): ActiveJob[] {
  try { return JSON.parse(localStorage.getItem(KEY.jobs()) ?? '[]') } catch { return [] }
}
export function saveJobs(jobs: ActiveJob[]) {
  localStorage.setItem(KEY.jobs(), JSON.stringify(jobs))
}
export function getActiveJobForRobot(robotId: string): ActiveJob | null {
  return getJobs().find((j: ActiveJob) => j.robotId === robotId && j.status !== 'COLLECTED') ?? null
}
export function startJob(robotId: string): { ok: boolean; error?: string } {
  const robots = getRobots()
  const robot = robots.find((r: Robot) => r.id === robotId)
  if (!robot) return { ok: false, error: 'Robot not found' }
  if (robot.status !== 'IDLE') return { ok: false, error: 'Robot is not idle' }
  if (robot.durability <= 0) return { ok: false, error: 'Robot needs repair' }

  const type = ROBOT_TYPES.find(t => t.key === robot.robotTypeKey)
  if (!type) return { ok: false, error: 'Unknown robot type' }

  // Check consumptions
  const inv = getInventory()
  for (const c of type.consumptions) {
    if ((inv[c.resourceKey] ?? 0) < c.amountPerJob) {
      return { ok: false, error: `Not enough ${RESOURCE_META[c.resourceKey]?.name ?? c.resourceKey}` }
    }
  }
  // Deduct consumptions
  for (const c of type.consumptions) {
    inv[c.resourceKey] = (inv[c.resourceKey] ?? 0) - c.amountPerJob
  }
  saveInventory(inv)

  const durationSecs = type.baseDurationSecs
  const startedAt = new Date().toISOString()
  const completesAt = new Date(Date.now() + durationSecs * 1000).toISOString()

  const job: ActiveJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    robotId,
    userId: userId(),
    startedAt,
    completesAt,
    durationSecs,
    resourceKey: type.producedResourceKey,
    expectedAmount: type.baseOutputAmount,
    status: 'RUNNING',
  }

  const jobs = getJobs().filter((j: ActiveJob) => j.robotId !== robotId)
  saveJobs([...jobs, job])
  updateRobot(robotId, { status: 'WORKING' })
  return { ok: true }
}

export function collectJob(robotId: string): { ok: boolean; error?: string; amount?: number; resourceKey?: string } {
  const jobs = getJobs()
  const job = jobs.find((j: ActiveJob) => j.robotId === robotId && j.status !== 'COLLECTED')
  if (!job) return { ok: false, error: 'No job to collect' }

  const now = Date.now()
  const completesAt = new Date(job.completesAt).getTime()
  if (now < completesAt) return { ok: false, error: 'Job not complete yet' }

  job.status = 'COLLECTED'
  saveJobs(jobs)

  addInventory(job.resourceKey, job.expectedAmount)

  // Reduce durability
  const robot = getRobots().find((r: Robot) => r.id === robotId)
  if (robot) {
    const newDurability = Math.max(0, robot.durability - 5)
    const newStatus = newDurability <= 0 ? 'NEEDS_REPAIR' : 'IDLE'
    updateRobot(robotId, { status: newStatus, durability: newDurability, lifetimeWear: robot.lifetimeWear + 5 })
  }

  // Update avatar stats
  const avatar = getAvatar()
  if (avatar) {
    avatar.totalJobs += 1
    avatar.totalProduced += job.expectedAmount
    saveAvatar(avatar)
  }

  return { ok: true, amount: job.expectedAmount, resourceKey: job.resourceKey }
}

export function repairRobot(robotId: string): { ok: boolean; error?: string } {
  const robot = getRobots().find((r: Robot) => r.id === robotId)
  if (!robot) return { ok: false, error: 'Robot not found' }
  const repairCost = Math.ceil((100 - robot.durability) * 0.5)  // 0.5 maintenance per point
  const inv = getInventory()
  if ((inv['MAINTENANCE'] ?? 0) < repairCost && repairCost > 0) {
    // Auto-repair with iron if no maintenance kits
    const ironCost = repairCost * 5
    if ((inv['IRON'] ?? 0) < ironCost) {
      return { ok: false, error: `Need ${repairCost} Maintenance or ${ironCost} Iron to repair` }
    }
    inv['IRON'] = (inv['IRON'] ?? 0) - ironCost
  } else {
    inv['MAINTENANCE'] = (inv['MAINTENANCE'] ?? 0) - repairCost
  }
  saveInventory(inv)
  updateRobot(robotId, { durability: 100, status: 'IDLE' })
  return { ok: true }
}

// ---- AUTO-COMPLETE JOBS (run on load) ----
export function syncJobs() {
  const jobs = getJobs()
  const now = Date.now()
  let changed = false
  for (const job of jobs) {
    if (job.status === 'RUNNING' && new Date(job.completesAt).getTime() <= now) {
      job.status = 'COMPLETED'
      changed = true
      // Mark robot as having a completed job
      const robots = getRobots()
      const robot = robots.find((r: Robot) => r.id === job.robotId)
      if (robot && robot.status === 'WORKING') {
        updateRobot(robot.id, { status: 'WORKING' }) // keep working status until collected
      }
    }
  }
  if (changed) saveJobs(jobs)
}
