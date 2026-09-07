'use client'
import { useEffect, useState, useCallback } from 'react'
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

export default function UpgradesPage() {
  const [robots, setRobots] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [allResources, setAllResources] = useState<any[]>([])
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [msgs, setMsgs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    const t = localStorage.getItem('rf_token') ?? ''
    setToken(t)
    const headers = { Authorization: `Bearer ${t}` }
    const [r, inv, res] = await Promise.all([
      fetch('/api/robots', { headers }).then(r => r.json()),
      fetch('/api/inventory', { headers }).then(r => r.json()),
      fetch('/api/market', { headers }).then(r => r.json()),
    ])
    setRobots(r.data ?? [])
    setInventory(inv.data ?? [])
    setAllResources(res.data ?? [])
    if (!selectedRobot && (r.data ?? []).length > 0) {
      setSelectedRobot(r.data[0].id)
    }
  }, [selectedRobot])

  useEffect(() => { load() }, [load])

  const getInvAmount = (resourceKey: string) => {
    const r = allResources.find((r: any) => r.key === resourceKey)
    const item = inventory.find((i: any) => i.resourceId === r?.id)
    return item?.amount ?? 0
  }

  async function doUpgrade(robotId: string, attribute: UpgradeAttribute) {
    const key = `${robotId}:${attribute}`
    setLoading(l => ({ ...l, [key]: true }))
    setMsgs(m => ({ ...m, [key]: '' }))
    try {
      const res = await fetch(`/api/robots/${robotId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attribute }),
      })
      const json = await res.json()
      if (res.ok) { setMsgs(m => ({ ...m, [key]: '✓ ' + json.data.message })); load() }
      else setMsgs(m => ({ ...m, [key]: '✗ ' + (json.error ?? 'Error') }))
    } finally { setLoading(l => ({ ...l, [key]: false })) }
  }

  const robot = robots.find(r => r.id === selectedRobot)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Upgrades</h1>
        <p className="page-subtitle">Enhance your robots' capabilities</p>
      </div>

      {/* Robot selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {robots.map(r => (
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
                {({ MINER: '⛏️', FARMER: '🌾', COLLECTOR: '🔍', WORKER: '🔬' } as Record<string, string>)[robot.robotType?.key ?? ''] ?? '🤖'}
              </div>
              <div>
                <h2 style={{ fontSize: 18, marginBottom: 2 }}>{robot.name}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{robot.robotType?.name}</div>
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
              const currentLevel = robot[ATTR_TO_FIELD[attr.key]] as number
              const currentDef = UPGRADE_DEFINITIONS[attr.key][currentLevel]
              const nextDef = UPGRADE_DEFINITIONS[attr.key][currentLevel + 1]
              const isMax = !nextDef
              const key = `${robot.id}:${attr.key}`

              const canAfford = nextDef?.cost.every(c => getInvAmount(c.resourceKey) >= c.amount) ?? false

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
                        {nextDef.cost.map(c => {
                          const have = getInvAmount(c.resourceKey)
                          const ok = have >= c.amount
                          return (
                            <span key={c.resourceKey} className="resource-chip" style={{
                              borderColor: ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                              color: ok ? 'var(--color-success)' : 'var(--color-danger)',
                              fontSize: 12,
                            }}>
                              {formatNumber(c.amount)} {c.resourceKey}
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
                      disabled={!canAfford || loading[key]}
                      onClick={() => doUpgrade(robot.id, attr.key)}
                    >
                      {loading[key] ? 'UPGRADING...' : canAfford ? `⬆ UPGRADE TO LEVEL ${currentLevel + 1}` : '⚠ INSUFFICIENT RESOURCES'}
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
