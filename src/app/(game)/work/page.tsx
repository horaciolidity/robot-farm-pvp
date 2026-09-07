'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatDuration, progressPercent, timeUntil } from '@/lib/formatters'

function CountdownBar({ job }: { job: any }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const pct = progressPercent(job.startedAt, job.completesAt)
  const remaining = timeUntil(job.completesAt)
  const done = remaining === 0

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

export default function WorkPage() {
  const [robots, setRobots] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [msgs, setMsgs] = useState<Record<string, string>>({})
  const [working, setWorking] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    const t = localStorage.getItem('rf_token') ?? ''
    setToken(t)
    const headers = { Authorization: `Bearer ${t}` }
    const [r, inv] = await Promise.all([
      fetch('/api/robots', { headers }).then(r => r.json()),
      fetch('/api/inventory', { headers }).then(r => r.json()),
    ])
    setRobots(r.data ?? [])
    setInventory(inv.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [load])

  function setMsg(robotId: string, msg: string) {
    setMsgs(m => ({ ...m, [robotId]: msg }))
  }

  async function assignJob(robotId: string) {
    setWorking(w => ({ ...w, [robotId]: true })); setMsg(robotId, '')
    try {
      const res = await fetch(`/api/robots/${robotId}/assign-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok) { setMsg(robotId, '✓ ' + json.data.message); load() }
      else setMsg(robotId, '✗ ' + (json.error ?? 'Error'))
    } finally { setWorking(w => ({ ...w, [robotId]: false })) }
  }

  async function collectJob(robotId: string) {
    setWorking(w => ({ ...w, [robotId]: true })); setMsg(robotId, '')
    try {
      const res = await fetch(`/api/robots/${robotId}/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok) {
        const d = json.data
        setMsg(robotId, `✓ ${d.message}${d.robotUpdate?.needsRepair ? ' ⚠ Robot needs repair!' : ''}`)
        load()
      } else setMsg(robotId, '✗ ' + (json.error ?? 'Error'))
    } finally { setWorking(w => ({ ...w, [robotId]: false })) }
  }

  const getInv = (resourceId: string) => inventory.find((i: any) => i.resourceId === resourceId)?.amount ?? 0

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>

  const idleRobots = robots.filter(r => r.status === 'IDLE')
  const workingRobots = robots.filter(r => r.status === 'WORKING')
  const repairRobots = robots.filter(r => r.status === 'NEEDS_REPAIR')

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
            {workingRobots.map(robot => {
              const job = robot.jobs?.[0]
              if (!job) return null
              const remaining = timeUntil(job.completesAt)
              const done = remaining === 0

              return (
                <div key={robot.id} className="card" style={{ borderColor: done ? 'rgba(34,197,94,0.4)' : 'rgba(0,212,255,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16 }}>{robot.name}</h3>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {robot.robotType?.name} · Producing <strong style={{ color: 'var(--accent-primary)' }}>{job.expectedAmount?.toFixed(1)} {job.outputResource?.name}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Consumes: {robot.robotType?.consumptions?.map((c: any) => `${c.amountPerJob} ${c.resource.name}`).join(', ')}
                      </div>
                    </div>
                    {done ? (
                      <button className="btn btn-success" disabled={working[robot.id]} onClick={() => collectJob(robot.id)}>
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

                  {msgs[robot.id] && (
                    <div style={{ marginTop: 10, fontSize: 13, padding: '8px 12px', borderRadius: 6,
                      background: msgs[robot.id].startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: msgs[robot.id].startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {msgs[robot.id]}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Idle robots — assign work */}
      {idleRobots.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div className="section-title">Idle Robots — Assign Work</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {idleRobots.map(robot => {
              const type = robot.robotType
              return (
                <div key={robot.id} className="card" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div className="robot-avatar" style={{ fontSize: 28 }}>
                      {({ MINER: '⛏️', FARMER: '🌾', COLLECTOR: '🔍', WORKER: '🔬' } as Record<string, string>)[type?.key ?? ''] ?? '🤖'}
                    </div>
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
                        +{type?.baseOutputAmount} {type?.producedResource?.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>in {formatDuration(type?.baseDurationSecs)}</div>
                    </div>
                    {/* Consumes */}
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CONSUMES</div>
                      {type?.consumptions?.map((c: any) => {
                        const have = getInv(c.resourceId)
                        const ok = have >= c.amountPerJob
                        return (
                          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: ok ? 'var(--text-secondary)' : 'var(--color-danger)' }}>
                            <span>{c.resource.icon} {c.amountPerJob} {c.resource.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(have: {have.toFixed(0)})</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-full"
                    disabled={working[robot.id] || robot.durability < 10}
                    onClick={() => assignJob(robot.id)}
                  >
                    {working[robot.id] ? 'STARTING...' : robot.durability < 10 ? '🔧 NEEDS REPAIR FIRST' : '⚙️ START JOB'}
                  </button>

                  {msgs[robot.id] && (
                    <div style={{ marginTop: 10, fontSize: 13, padding: '8px 12px', borderRadius: 6,
                      background: msgs[robot.id].startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: msgs[robot.id].startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {msgs[robot.id]}
                    </div>
                  )}
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
