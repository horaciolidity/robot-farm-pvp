'use client'
import { useEffect, useState } from 'react'
import { getRobots, getInventory, getJobs, syncJobs, startJob, collectJob as doCollect, ROBOT_TYPES, RESOURCE_META, Robot, ActiveJob } from '@/lib/game-store'
import { formatDuration, progressPercent, timeUntil } from '@/lib/formatters'

function CountdownBar({ job }: { job: ActiveJob }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const pct = progressPercent(job.startedAt, job.completesAt)
  const remaining = timeUntil(job.completesAt)
  const done = remaining === 0 || new Date(job.completesAt).getTime() <= Date.now()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: done ? 'var(--color-success)' : 'var(--text-secondary)' }}>
          {done ? '✅ READY TO COLLECT' : `⏱ ${formatDuration(remaining)} remaining`}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="progress-bar tall">
        <div className={`progress-fill ${done ? 'success' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

import { toast } from 'sonner'

export default function WorkPage() {
  const [robots, setRobots] = useState<Robot[]>([])
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [jobs, setJobs] = useState<ActiveJob[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<Record<string, boolean>>({})

  function refresh() {
    syncJobs()
    setRobots(getRobots())
    setInventory(getInventory())
    setJobs(getJobs())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [])

  function handleAssign(robotId: string) {
    setWorking(w => ({ ...w, [robotId]: true }))
    const result = startJob(robotId)
    if (result.ok) { toast.success('Job started!'); refresh() }
    else toast.error(result.error)
    setWorking(w => ({ ...w, [robotId]: false }))
  }

  function handleCollect(robotId: string) {
    setWorking(w => ({ ...w, [robotId]: true }))
    const result = doCollect(robotId)
    if (result.ok) {
      toast.success(`Collected ${result.amount?.toFixed(1)} ${RESOURCE_META[result.resourceKey ?? '']?.name}!`)
      refresh()
    } else {
      toast.error(result.error)
    }
    setWorking(w => ({ ...w, [robotId]: false }))
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>

  const idleRobots = robots.filter((r: Robot) => r.status === 'IDLE')
  const workingRobots = robots.filter((r: Robot) => r.status === 'WORKING')
  const repairRobots = robots.filter((r: Robot) => r.status === 'NEEDS_REPAIR')

  const getJobForRobot = (robotId: string) => jobs.find((j: ActiveJob) => j.robotId === robotId && j.status !== 'COLLECTED') ?? null

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Work Assignment</h1>
        <p className="page-subtitle">Assign robots to jobs and collect their output</p>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: 32 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>⚙️</div>
          <div className="stat-value">{workingRobots.length}</div>
          <div className="stat-label">Working</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>😴</div>
          <div className="stat-value">{idleRobots.length}</div>
          <div className="stat-label">Idle</div>
        </div>
        <div className="card" style={{ textAlign: 'center', borderColor: repairRobots.length > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🔧</div>
          <div className="stat-value" style={{ color: repairRobots.length > 0 ? 'var(--color-danger)' : undefined }}>{repairRobots.length}</div>
          <div className="stat-label">Need Repair</div>
        </div>
      </div>

      {/* Active Jobs */}
      {workingRobots.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div className="section-title">Active Jobs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {workingRobots.map((robot: Robot) => {
              const job = getJobForRobot(robot.id)
              if (!job) return null
              const done = new Date(job.completesAt).getTime() <= Date.now()
              const type = ROBOT_TYPES.find(t => t.key === robot.robotTypeKey)

              return (
                <div key={robot.id} className="card" style={{ borderColor: done ? 'rgba(34,197,94,0.4)' : 'rgba(0,212,255,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16 }}>{robot.name}</h3>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {type?.name} · Producing <strong style={{ color: 'var(--accent-primary)' }}>{job.expectedAmount.toFixed(1)} {RESOURCE_META[job.resourceKey]?.name}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Consumes: {type?.consumptions.map((c: any) => `${c.amountPerJob} ${RESOURCE_META[c.resourceKey]?.name}`).join(', ')}
                      </div>
                    </div>
                    {done ? (
                      <button className="btn btn-success animate-glow" disabled={working[robot.id]} onClick={() => handleCollect(robot.id)}>
                        📦 COLLECT
                      </button>
                    ) : (
                      <span className="badge badge-working">
                        <span className="status-dot working"></span>
                        IN PROGRESS
                      </span>
                    )}
                  </div>

                  <CountdownBar job={job} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Idle robots */}
      {idleRobots.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div className="section-title">Idle Robots — Assign Work</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {idleRobots.map((robot: Robot) => {
              const type = ROBOT_TYPES.find(t => t.key === robot.robotTypeKey)
              return (
                <div key={robot.id} className="card" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div className="robot-avatar" style={{ fontSize: 28 }}>{type?.icon ?? '🤖'}</div>
                    <div style={{ flex: 1 }}>
                      <h3>{robot.name}</h3>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{type?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Durability: <span style={{ color: robot.durability < 30 ? 'var(--color-danger)' : 'var(--color-success)' }}>{robot.durability.toFixed(0)}/100</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {/* Produces */}
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>PRODUCES</div>
                      <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                        +{type?.baseOutputAmount} {RESOURCE_META[type?.producedResourceKey ?? '']?.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>in {formatDuration(type?.baseDurationSecs ?? 60)}</div>
                    </div>
                    {/* Consumes */}
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CONSUMES</div>
                      {type?.consumptions.map((c: any) => {
                        const have = inventory[c.resourceKey] ?? 0
                        const ok = have >= c.amountPerJob
                        return (
                          <div key={c.resourceKey} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: ok ? 'var(--text-secondary)' : 'var(--color-danger)' }}>
                            <span>{RESOURCE_META[c.resourceKey]?.icon} {c.amountPerJob} {RESOURCE_META[c.resourceKey]?.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(have: {have.toFixed(0)})</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-full"
                    disabled={working[robot.id] || robot.durability < 10}
                    onClick={() => handleAssign(robot.id)}
                  >
                    {working[robot.id] ? 'STARTING...' : robot.durability < 10 ? '🔧 NEEDS REPAIR FIRST' : '⚙️ START JOB'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {robots.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <h2 style={{ color: 'var(--text-muted)' }}>No robots available</h2>
          <a href="/robots" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            Acquire Robots →
          </a>
        </div>
      )}
    </div>
  )
}
