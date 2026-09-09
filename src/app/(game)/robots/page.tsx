'use client'
import { useEffect, useState } from 'react'
import { getRobots, getAvatar, getInventory, getJobs, syncJobs, acquireRobot, repairRobot, collectJob, ROBOT_TYPES, RESOURCE_META, Robot, ActiveJob } from '@/lib/game-store'
import { formatNumber, formatDuration, progressPercent, timeUntil } from '@/lib/formatters'
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

import { toast } from 'sonner'

function RobotCard({ robot, job, onAction }: { robot: Robot; job: ActiveJob | null; onAction: () => void }) {
  const [loading, setLoading] = useState(false)

  const hasActiveJob = job && job.status === 'RUNNING'
  const jobDone = job && job.status !== 'COLLECTED' && new Date(job.completesAt).getTime() <= Date.now()
  const pct = hasActiveJob ? progressPercent(job!.startedAt, job!.completesAt) : 0
  const durabColor = robot.durability > 50 ? 'var(--color-success)' : robot.durability > 30 ? 'var(--color-warning)' : 'var(--color-danger)'

  function doRepair() {
    setLoading(true)
    const result = repairRobot(robot.id)
    if (result.ok) toast.success('Robot repaired!')
    else toast.error(result.error)
    setLoading(false)
    onAction()
  }

  function doCollect() {
    setLoading(true)
    const result = collectJob(robot.id)
    if (result.ok) {
      toast.success(`Collected ${result.amount?.toFixed(1)} ${RESOURCE_META[result.resourceKey ?? '']?.name ?? result.resourceKey}`)
    } else {
      toast.error(result.error)
    }
    setLoading(false)
    onAction()
  }


  return (
    <div className={`card`}
      style={{ borderColor: hasActiveJob ? 'rgba(34,197,94,0.3)' : robot.status === 'NEEDS_REPAIR' ? 'rgba(239,68,68,0.3)' : undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
        <div className="robot-avatar">{STATUS_EMOJI[robot.robotTypeKey] ?? '🤖'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, marginBottom: 2 }}>{robot.name}</h3>
            <span className={`badge ${robot.status === 'IDLE' ? 'badge-idle' : robot.status === 'WORKING' ? 'badge-working' : robot.status === 'NEEDS_REPAIR' ? 'badge-repair' : 'badge-locked'}`}>
              {robot.status === 'WORKING' && <span className="status-dot working"></span>}
              {robot.status}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ROBOT_TYPES.find(t => t.key === robot.robotTypeKey)?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>LVL {robot.level} · XP {robot.experience}</div>
        </div>
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
      </div>

      {/* Combat Stats */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        <div title="Health Points">❤️ {robot.hp}/{robot.maxHp ?? robot.hp}</div>
        <div title="Attack">⚔️ {robot.attack}</div>
        <div title="Defense">🛡️ {robot.defense}</div>
        <div title="Speed">⚡ {robot.speed}</div>
      </div>

      {/* Active job */}
      {hasActiveJob && !jobDone && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>JOB PROGRESS</span>
            <span style={{ color: 'var(--color-success)' }}>
              <CountdownTimer completesAt={job!.completesAt} />
            </span>
          </div>
          <div className="progress-bar tall">
            <div className="progress-fill animate" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>⛏ +{job!.expectedAmount} {RESOURCE_META[job!.resourceKey]?.name}</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(jobDone || (job && job.status === 'COMPLETED')) && (
          <button className="btn btn-success btn-sm animate-glow" disabled={loading} onClick={doCollect}>
            📦 COLLECT
          </button>
        )}
        {robot.status === 'IDLE' && (
          <Link href="/work" className="btn btn-primary btn-sm">⚙️ ASSIGN WORK</Link>
        )}
        {(robot.status === 'NEEDS_REPAIR' || robot.durability < 30) && (
          <button className="btn btn-danger btn-sm animate-shake" disabled={loading} onClick={doRepair}>
            🔧 REPAIR
          </button>
        )}
        <Link href="/upgrades" className="btn btn-ghost btn-sm">⬆ UPGRADES</Link>
      </div>
    </div>
  )
}

export default function RobotsPage() {
  const [robots, setRobots] = useState<Robot[]>([])
  const [avatar, setAvatar] = useState<any>(null)
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [jobs, setJobs] = useState<ActiveJob[]>([])
  const [loading, setLoading] = useState(true)
  const [acquiring, setAcquiring] = useState(false)
  const [acquireMsg, setAcquireMsg] = useState('')

  function refresh() {
    syncJobs()
    setRobots(getRobots())
    setAvatar(getAvatar())
    setInventory(getInventory())
    setJobs(getJobs())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [])

  function handleAcquire(typeKey: string) {
    setAcquiring(true)
    const result = acquireRobot(typeKey)
    if (result.ok) toast.success('Robot acquired!')
    else toast.error(result.error)
    setAcquiring(false)
    refresh()
  }

  const ownedCount = robots.filter((r: Robot) => r.status !== 'RETIRED').length
  const capacity = avatar?.robotSlots ?? 2

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
            {robots.map((r: Robot) => {
              const job = jobs.find((j: ActiveJob) => j.robotId === r.id && j.status !== 'COLLECTED') ?? null
              return <RobotCard key={r.id} robot={r} job={job} onAction={refresh} />
            })}
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
          <div className="grid-2">
            {ROBOT_TYPES.filter(t => !t.isLocked).map(type => {
              const canAfford = type.acquisitionCosts.every((c: any) => (inventory[c.resourceKey] ?? 0) >= c.amount)
              const isFree = type.acquisitionCosts.length === 0
              return (
                <div key={type.key} className="card" style={{ opacity: canAfford || isFree ? 1 : 0.7 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div className="robot-avatar" style={{ fontSize: 28 }}>{type.icon}</div>
                    <div>
                      <h3>{type.name}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{type.description}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>PRODUCES</div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                        +{type.baseOutputAmount} {RESOURCE_META[type.producedResourceKey]?.name}/job
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
                  {type.consumptions.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CONSUMES PER JOB</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {type.consumptions.map((c: any) => (
                          <span key={c.resourceKey} className="resource-chip" style={{ fontSize: 12 }}>
                            {RESOURCE_META[c.resourceKey]?.icon} {c.amountPerJob} {RESOURCE_META[c.resourceKey]?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

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
                          const have = inventory[c.resourceKey] ?? 0
                          const ok = have >= c.amount
                          return (
                            <span key={c.resourceKey} className="resource-chip" style={{ fontSize: 12, borderColor: ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)', color: ok ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              {RESOURCE_META[c.resourceKey]?.icon} {formatNumber(c.amount)} {RESOURCE_META[c.resourceKey]?.name}
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
                    onClick={() => handleAcquire(type.key)}
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
        {ROBOT_TYPES.filter(t => t.isLocked).map(type => (
          <div key={type.key} className="card" style={{ opacity: 0.5, borderColor: 'rgba(100,116,139,0.2)' }}>
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
