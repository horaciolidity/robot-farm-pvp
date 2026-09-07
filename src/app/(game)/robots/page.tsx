'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatNumber, formatDuration, progressPercent, timeUntil } from '@/lib/formatters'
import { UPGRADE_DEFINITIONS, UpgradeAttribute } from '@/modules/upgrades/upgrades.constants'
import Link from 'next/link'

const STATUS_EMOJI: Record<string, string> = {
  MINER: '⛏️', FARMER: '🌾', COLLECTOR: '🔍', WORKER: '🔬', COMBAT: '⚔️',
}

function CountdownTimer({ completesAt }: { completesAt: string }) {
  const [remaining, setRemaining] = useState(timeUntil(completesAt))

  useEffect(() => {
    const t = setInterval(() => setRemaining(timeUntil(completesAt)), 1000)
    return () => clearInterval(t)
  }, [completesAt])

  return <span>{remaining > 0 ? formatDuration(remaining) : 'READY TO COLLECT'}</span>
}

function RobotCard({ robot, onAction, token }: { robot: any; onAction: () => void; token: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const job = robot.jobs?.[0]
  const hasActiveJob = job && job.status === 'RUNNING'
  const jobDone = job && job.status !== 'COLLECTED' && timeUntil(job.completesAt) === 0

  const durabColor = robot.durability > 50 ? 'var(--color-success)' : robot.durability > 30 ? 'var(--color-warning)' : 'var(--color-danger)'

  async function doAction(action: string, body?: any) {
    setLoading(true); setMsg('')
    try {
      const res = await fetch(`/api/robots/${robot.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      })
      const json = await res.json()
      if (res.ok) { setMsg('✓ ' + (json.data?.message ?? 'Done')); onAction() }
      else setMsg('✗ ' + (json.error ?? 'Error'))
    } finally { setLoading(false) }
  }

  const pct = hasActiveJob ? progressPercent(job.startedAt, job.completesAt) : 0

  return (
    <div className={`card ${robot.status === 'NEEDS_REPAIR' ? 'card-danger' : hasActiveJob ? '' : ''}`}
      style={{ borderColor: hasActiveJob ? 'rgba(34,197,94,0.3)' : robot.status === 'NEEDS_REPAIR' ? 'rgba(239,68,68,0.3)' : undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
        <div className="robot-avatar">
          {STATUS_EMOJI[robot.robotType?.key ?? ''] ?? '🤖'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, marginBottom: 2 }}>{robot.name}</h3>
            <span className={`badge ${robot.status === 'IDLE' ? 'badge-idle' : robot.status === 'WORKING' ? 'badge-working' : robot.status === 'NEEDS_REPAIR' ? 'badge-repair' : 'badge-locked'}`}>
              {robot.status === 'WORKING' && <span className="status-dot working"></span>}
              {robot.status}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{robot.robotType?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            LVL {robot.level} · XP {robot.experience}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'PRODUCTION', value: `${UPGRADE_DEFINITIONS.PRODUCTION[robot.upgradeProduction]?.value?.toFixed(1)}x`, color: 'var(--accent-primary)' },
          { label: 'EFFICIENCY', value: `${((UPGRADE_DEFINITIONS.EFFICIENCY[robot.upgradeEfficiency]?.value ?? 0) * 100).toFixed(0)}%`, color: 'var(--color-success)' },
          { label: 'SPEED', value: `${((UPGRADE_DEFINITIONS.SPEED[robot.upgradeSpeed]?.value ?? 0) * 100).toFixed(0)}%`, color: 'var(--res-silicon)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', color: s.color, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Durability */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-muted)' }}>DURABILITY</span>
          <span style={{ color: durabColor, fontWeight: 600 }}>{robot.durability.toFixed(0)}/100</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-fill ${robot.durability < 30 ? 'danger' : robot.durability < 60 ? 'warning' : ''}`}
            style={{ width: `${robot.durability}%` }} />
        </div>
        {robot.durability < 30 && (
          <div style={{ fontSize: 11, color: 'var(--color-warning)', marginTop: 4 }}>
            ⚠ Robot requires maintenance
          </div>
        )}
      </div>

      {/* Active job */}
      {hasActiveJob && !jobDone && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>JOB PROGRESS</span>
            <span style={{ color: 'var(--color-success)' }}>
              <CountdownTimer completesAt={job.completesAt} />
            </span>
          </div>
          <div className="progress-bar tall">
            <div className="progress-fill animate" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>⛏ +{job.expectedAmount?.toFixed(1)} {job.outputResource?.name}</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(jobDone || (job && job.status === 'COMPLETED')) && (
          <button className="btn btn-success btn-sm" disabled={loading} onClick={() => doAction('collect')}>
            📦 COLLECT
          </button>
        )}
        {robot.status === 'IDLE' && (
          <Link href="/work" className="btn btn-primary btn-sm">⚙️ ASSIGN WORK</Link>
        )}
        {robot.status === 'NEEDS_REPAIR' && (
          <button className="btn btn-danger btn-sm" disabled={loading} onClick={() => doAction('repair')}>
            🔧 REPAIR
          </button>
        )}
        {robot.durability < 30 && robot.status === 'IDLE' && (
          <button className="btn btn-secondary btn-sm" disabled={loading} onClick={() => doAction('repair')}>
            🔧 REPAIR ({100 - Math.ceil(robot.durability)} pts)
          </button>
        )}
        <Link href="/upgrades" className="btn btn-ghost btn-sm">⬆ UPGRADES</Link>
      </div>

      {msg && (
        <div style={{ marginTop: 10, fontSize: 12, padding: '6px 10px', borderRadius: 6,
          background: msg.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {msg}
        </div>
      )}
    </div>
  )
}

export default function RobotsPage() {
  const [robots, setRobots] = useState<any[]>([])
  const [robotTypes, setRobotTypes] = useState<any[]>([])
  const [avatar, setAvatar] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acquiring, setAcquiring] = useState(false)
  const [acquireMsg, setAcquireMsg] = useState('')
  const [token, setToken] = useState('')

  const load = useCallback(async () => {
    const t = localStorage.getItem('rf_token') ?? ''
    setToken(t)
    const headers = { Authorization: `Bearer ${t}` }

    const [r, types, av, inv] = await Promise.all([
      fetch('/api/robots', { headers }).then(r => r.json()),
      fetch('/api/robots/types', { headers }).then(r => r.json()),
      fetch('/api/avatar', { headers }).then(r => r.json()),
      fetch('/api/inventory', { headers }).then(r => r.json()),
    ])

    setRobots(r.data ?? [])
    setRobotTypes(types.data ?? [])
    setAvatar(av.data)
    setInventory(inv.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function acquireRobot(typeKey: string) {
    setAcquiring(true); setAcquireMsg('')
    try {
      const res = await fetch('/api/robots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ robotTypeKey: typeKey }),
      })
      const json = await res.json()
      if (res.ok) { setAcquireMsg('✓ ' + json.data.message); load() }
      else setAcquireMsg('✗ ' + (json.error ?? 'Error'))
    } finally { setAcquiring(false) }
  }

  const ownedCount = robots.filter(r => r.status !== 'RETIRED').length
  const capacity = avatar?.robotSlots ?? 2

  const getInventoryAmount = (resourceId: string) => {
    return inventory.find((i: any) => i.resourceId === resourceId)?.amount ?? 0
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading robots...</div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">My Robots</h1>
            <p className="page-subtitle">Manage your robot fleet</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: ownedCount >= capacity ? 'var(--color-warning)' : 'var(--accent-primary)' }}>
              🤖 {ownedCount} / {capacity}
            </div>
            {ownedCount >= capacity && (
              <Link href="/expansion" className="btn btn-secondary btn-sm">+ EXPAND</Link>
            )}
          </div>
        </div>
      </div>

      {/* My Robots */}
      {robots.length > 0 ? (
        <div>
          <div className="section-title">Your Fleet</div>
          <div className="grid-2" style={{ marginBottom: 40 }}>
            {robots.map(r => (
              <RobotCard key={r.id} robot={r} token={token} onAction={load} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 48, marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <h2 style={{ color: 'var(--text-muted)' }}>No robots yet</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Acquire your first robot below</p>
        </div>
      )}

      {/* Available Robot Types */}
      {ownedCount < capacity && (
        <div>
          <div className="section-title">Acquire Robot</div>
          {acquireMsg && (
            <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8,
              background: acquireMsg.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: acquireMsg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)',
              border: `1px solid ${acquireMsg.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              {acquireMsg}
            </div>
          )}
          <div className="grid-2">
            {robotTypes.filter(t => !t.isLocked).map(type => {
              const canAfford = type.acquisitionCosts.every((c: any) =>
                getInventoryAmount(c.resourceId) >= c.amount
              )
              const isFree = type.acquisitionCosts.length === 0

              return (
                <div key={type.id} className={`card ${canAfford || isFree ? '' : ''}`} style={{ opacity: canAfford || isFree ? 1 : 0.7 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div className="robot-avatar" style={{ fontSize: 28 }}>{STATUS_EMOJI[type.key] ?? '🤖'}</div>
                    <div>
                      <h3>{type.name}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{type.description}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>PRODUCES</div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                        +{type.baseOutputAmount} {type.producedResource?.name}/job
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>DURATION</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {formatDuration(type.baseDurationSecs)}
                      </div>
                    </div>
                  </div>

                  {/* Consumes */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CONSUMES PER JOB</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {type.consumptions.map((c: any) => (
                        <span key={c.id} className="resource-chip" style={{ fontSize: 12 }}>
                          {c.resource.icon} {c.amountPerJob} {c.resource.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cost */}
                  {isFree ? (
                    <div style={{ marginBottom: 12, color: 'var(--color-success)', fontSize: 13, fontWeight: 600 }}>
                      🎁 Free (starter robot)
                    </div>
                  ) : (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ACQUISITION COST</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {type.acquisitionCosts.map((c: any) => {
                          const have = getInventoryAmount(c.resourceId)
                          const ok = have >= c.amount
                          return (
                            <span key={c.id} className="resource-chip" style={{ fontSize: 12, borderColor: ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)', color: ok ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              {c.resource.icon} {formatNumber(c.amount)} {c.resource.name}
                              {!ok && <span style={{ fontSize: 10 }}> ({formatNumber(have)} have)</span>}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    className={`btn btn-full ${canAfford || isFree ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={(!canAfford && !isFree) || acquiring}
                    onClick={() => acquireRobot(type.key)}
                  >
                    {isFree ? '🎁 CLAIM FREE ROBOT' : canAfford ? '🤖 ACQUIRE ROBOT' : '⚠ INSUFFICIENT RESOURCES'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Locked robots */}
      <div style={{ marginTop: 32 }}>
        <div className="section-title">Locked</div>
        {robotTypes.filter(t => t.isLocked).map(type => (
          <div key={type.id} className="card" style={{ opacity: 0.5, borderColor: 'rgba(100,116,139,0.2)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="robot-avatar" style={{ filter: 'grayscale(1)', fontSize: 28 }}>⚔️</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ color: 'var(--text-muted)' }}>{type.name}</h3>
                  <span className="badge badge-locked">🔒 LOCKED</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{type.description}</p>
              </div>
              <Link href="/combat" className="btn btn-ghost btn-sm">View Requirements →</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
