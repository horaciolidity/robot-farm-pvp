'use client'
import { useEffect, useState } from 'react'
import { getRobots, getInventory, updateRobot, saveRobots, saveInventory, RESOURCE_META, Robot } from '@/lib/game-store'
import { UPGRADE_DEFINITIONS, UpgradeAttribute } from '@/modules/upgrades/upgrades.constants'
import { formatNumber } from '@/lib/formatters'

const ATTRIBUTES: { key: UpgradeAttribute; label: string; icon: string; desc: string }[] = [
  { key: 'PRODUCTION', label: 'Production', icon: '⚡', desc: 'Increases output per job' },
  { key: 'EFFICIENCY', label: 'Efficiency', icon: '♻️', desc: 'Reduces resource consumption' },
  { key: 'SPEED', label: 'Speed', icon: '🚀', desc: 'Reduces job duration' },
  { key: 'DURABILITY', label: 'Durability', icon: '🛡️', desc: 'Reduces wear per job' },
  { key: 'ENERGY_CAPACITY', label: 'Energy Cap.', icon: '🔋', desc: 'Increases energy reserve' },
]

const ATTR_TO_FIELD: Record<UpgradeAttribute, string> = {
  PRODUCTION: 'upgradeProduction',
  EFFICIENCY: 'upgradeEfficiency',
  SPEED: 'upgradeSpeed',
  DURABILITY: 'upgradeDurability',
  ENERGY_CAPACITY: 'upgradeEnergyCapacity',
}

function doUpgradeLocal(robotId: string, attribute: UpgradeAttribute): { ok: boolean; error?: string; msg?: string } {
  const robots = getRobots()
  const robot = robots.find((r: Robot) => r.id === robotId)
  if (!robot) return { ok: false, error: 'Robot not found' }

  const field = ATTR_TO_FIELD[attribute] as keyof Robot
  const currentLevel = robot[field] as number
  const nextDef = UPGRADE_DEFINITIONS[attribute][currentLevel + 1]
  if (!nextDef) return { ok: false, error: 'Already at max level' }

  const inv = getInventory()
  for (const c of nextDef.cost) {
    if ((inv[c.resourceKey] ?? 0) < c.amount) {
      return { ok: false, error: `Not enough ${RESOURCE_META[c.resourceKey]?.name ?? c.resourceKey}` }
    }
  }
  for (const c of nextDef.cost) {
    inv[c.resourceKey] = (inv[c.resourceKey] ?? 0) - c.amount
  }
  saveInventory(inv)
  updateRobot(robotId, { [field]: currentLevel + 1 } as any)
  return { ok: true, msg: `${attribute} upgraded to level ${currentLevel + 1}!` }
}

export default function UpgradesPage() {
  const [robots, setRobots] = useState<Robot[]>([])
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<Record<string, string>>({})
  const [busyKey, setBusyKey] = useState<string | null>(null)

  function refresh() {
    const r = getRobots()
    setRobots(r)
    setInventory(getInventory())
    if (!selectedRobot && r.length > 0) setSelectedRobot(r[0].id)
  }

  useEffect(() => { refresh() }, [])

  function handleUpgrade(robotId: string, attribute: UpgradeAttribute) {
    const key = `${robotId}:${attribute}`
    setBusyKey(key)
    const result = doUpgradeLocal(robotId, attribute)
    setMsgs(m => ({ ...m, [key]: result.ok ? `✓ ${result.msg}` : `✗ ${result.error}` }))
    setBusyKey(null)
    refresh()
  }

  const robot = robots.find((r: Robot) => r.id === selectedRobot)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Upgrades</h1>
        <p className="page-subtitle">Enhance your robots' capabilities</p>
      </div>

      {/* Robot selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {robots.map((r: Robot) => (
          <button key={r.id}
            className={`btn ${selectedRobot === r.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedRobot(r.id)}
            style={{ fontSize: 13 }}
          >
            🤖 {r.name}
          </button>
        ))}
      </div>

      {robot ? (
        <div>
          {/* Robot info */}
          <div className="card card-accent" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div className="robot-avatar" style={{ width: 56, height: 56, fontSize: 28 }}>
                {({ MINER: '⛏️', FARMER: '🌾', COLLECTOR: '🔍', WORKER: '🔬' } as Record<string, string>)[robot.robotTypeKey] ?? '🤖'}
              </div>
              <div>
                <h2 style={{ fontSize: 18, marginBottom: 2 }}>{robot.name}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{robot.robotTypeKey}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '1.2rem' }}>LVL {robot.level}</div>
                  <div className="stat-label">Level</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '1.2rem' }}>{robot.durability.toFixed(0)}</div>
                  <div className="stat-label">Durability</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade cards */}
          <div className="grid-2">
            {ATTRIBUTES.map(attr => {
              const currentLevel = (robot as any)[ATTR_TO_FIELD[attr.key]] as number
              const currentDef = UPGRADE_DEFINITIONS[attr.key][currentLevel]
              const nextDef = UPGRADE_DEFINITIONS[attr.key][currentLevel + 1]
              const isMax = !nextDef
              const key = `${robot.id}:${attr.key}`
              const canAfford = nextDef?.cost.every((c: any) => (inventory[c.resourceKey] ?? 0) >= c.amount) ?? false

              return (
                <div key={attr.key} className={`card ${isMax ? '' : canAfford ? 'card-accent' : ''}`}
                  style={{ borderColor: isMax ? 'rgba(34,197,94,0.2)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{attr.icon}</span>
                        <h3 style={{ fontSize: 15 }}>{attr.label}</h3>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{attr.desc}</div>
                    </div>
                    {isMax ? (
                      <span className="badge badge-working">MAX</span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                        LEVEL {currentLevel} → {currentLevel + 1}
                      </span>
                    )}
                  </div>

                  {/* Current → Next */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>CURRENT</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-secondary)', fontWeight: 700 }}>
                        {attr.key === 'PRODUCTION' ? `${currentDef?.value.toFixed(1)}x` : `${((currentDef?.value ?? 0) * 100).toFixed(0)}%`}
                      </div>
                    </div>
                    {!isMax && (
                      <>
                        <div style={{ color: 'var(--accent-primary)', fontSize: 18 }}>→</div>
                        <div style={{ flex: 1, background: 'var(--accent-glow)', borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: '1px solid var(--border-dim)' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>AFTER</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent-primary)', fontWeight: 700 }}>
                            {attr.key === 'PRODUCTION' ? `${nextDef?.value.toFixed(1)}x` : `${((nextDef?.value ?? 0) * 100).toFixed(0)}%`}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Progress dots */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {UPGRADE_DEFINITIONS[attr.key].slice(1).map(lvl => (
                      <div key={lvl.level} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: lvl.level <= currentLevel ? 'var(--accent-primary)' : 'var(--bg-surface)',
                        boxShadow: lvl.level <= currentLevel ? '0 0 6px var(--accent-primary)' : 'none',
                      }} />
                    ))}
                  </div>

                  {/* Cost */}
                  {!isMax && nextDef && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>UPGRADE COST</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {nextDef.cost.map((c: any) => {
                          const have = inventory[c.resourceKey] ?? 0
                          const ok = have >= c.amount
                          return (
                            <span key={c.resourceKey} className="resource-chip" style={{
                              borderColor: ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                              color: ok ? 'var(--color-success)' : 'var(--color-danger)',
                              fontSize: 12,
                            }}>
                              {RESOURCE_META[c.resourceKey]?.icon} {formatNumber(c.amount)} {c.resourceKey}
                              {!ok && <span style={{ fontSize: 10 }}> (have: {formatNumber(have)})</span>}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {isMax ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-success)', fontSize: 13, fontWeight: 600 }}>
                      ✅ Maximum level reached
                    </div>
                  ) : (
                    <button
                      className={`btn btn-full ${canAfford ? 'btn-primary' : 'btn-secondary'}`}
                      disabled={!canAfford || busyKey === key}
                      onClick={() => handleUpgrade(robot.id, attr.key)}
                    >
                      {busyKey === key ? 'UPGRADING...' : canAfford ? `⬆ UPGRADE TO LEVEL ${currentLevel + 1}` : '⚠ INSUFFICIENT RESOURCES'}
                    </button>
                  )}

                  {msgs[key] && (
                    <div style={{ marginTop: 10, fontSize: 12, padding: '6px 10px', borderRadius: 6,
                      background: msgs[key].startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: msgs[key].startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {msgs[key]}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <p style={{ color: 'var(--text-muted)' }}>No robots to upgrade. Acquire a robot first.</p>
        </div>
      )}
    </div>
  )
}
