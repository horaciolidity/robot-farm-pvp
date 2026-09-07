'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAvatar, getRobots, getInventory, getJobs, syncJobs, RESOURCE_META, Avatar, Robot, ActiveJob } from '@/lib/game-store'
import { formatNumber, formatDuration, progressPercent, timeUntil } from '@/lib/formatters'

function ActiveJobCard({ robot, job }: { robot: Robot; job: ActiveJob }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const pct = progressPercent(job.startedAt, job.completesAt)
  const remaining = timeUntil(job.completesAt)
  const done = remaining === 0 || new Date(job.completesAt).getTime() <= now

  return (
    <div className="card" style={{ borderColor: done ? 'rgba(34,197,94,0.4)' : 'var(--border-dim)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-bright)' }}>{robot.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{robot.robotTypeKey}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {done ? (
            <Link href="/work" className="btn btn-success btn-sm">COLLECT</Link>
          ) : (
            <span className="badge badge-working">
              <span className="status-dot working"></span>
              {formatDuration(remaining)}
            </span>
          )}
        </div>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${done ? 'success' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>⛏ Producing {RESOURCE_META[job.resourceKey]?.name ?? job.resourceKey}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [robots, setRobots] = useState<Robot[]>([])
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [jobs, setJobs] = useState<ActiveJob[]>([])

  function refresh() {
    syncJobs()
    setAvatar(getAvatar())
    setRobots(getRobots())
    setInventory(getInventory())
    setJobs(getJobs())
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [])

  const KEY_RESOURCES = ['IRON', 'COPPER', 'SILICON', 'ENERGY', 'TITANIUM']
  const activeRobots = robots.filter((r: Robot) => r.status === 'WORKING')
  const idleRobots = robots.filter((r: Robot) => r.status === 'IDLE')
  const repairRobots = robots.filter((r: Robot) => r.status === 'NEEDS_REPAIR')

  const activeJobs = jobs.filter((j: ActiveJob) => j.status !== 'COLLECTED')

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {avatar ? `Welcome back, ${avatar.name}` : 'Loading...'}
            </p>
          </div>
          {avatar && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="player-level">LVL {avatar.level}</div>
              <div className="robot-capacity">
                🤖 <span>{robots.filter((r: Robot) => r.status !== 'RETIRED').length}</span>/{avatar.robotSlots}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Repair warning */}
      {repairRobots.length > 0 && (
        <div className="card card-danger" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                {repairRobots.length} robot{repairRobots.length > 1 ? 's' : ''} need repair
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {repairRobots.map((r: Robot) => r.name).join(', ')}
              </div>
            </div>
            <Link href="/robots" className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}>
              REPAIR
            </Link>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Produced', value: formatNumber(avatar?.totalProduced ?? 0), icon: '🏭' },
          { label: 'Level', value: avatar?.level ?? 1, icon: '⭐' },
          { label: 'Active Robots', value: `${activeRobots.length}/${robots.length}`, icon: '⚙️' },
          { label: 'Total Jobs', value: formatNumber(avatar?.totalJobs ?? 0), icon: '✅' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Left column */}
        <div>
          {/* Active Jobs */}
          <div style={{ marginBottom: 24 }}>
            <div className="section-title">Active Jobs</div>
            {activeJobs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>😴</div>
                <div style={{ color: 'var(--text-muted)' }}>No active jobs</div>
                <Link href="/work" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
                  ASSIGN ROBOTS
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeJobs.map((j: ActiveJob) => {
                  const robot = robots.find((r: Robot) => r.id === j.robotId)
                  if (!robot) return null
                  return <ActiveJobCard key={j.id} robot={robot} job={j} />
                })}
              </div>
            )}

            {/* Idle robots */}
            {idleRobots.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {idleRobots.map((r: Robot) => (
                  <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 8 }}>
                    <span className="status-dot idle"></span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Idle</span>
                    </div>
                    <Link href="/work" className="btn btn-secondary btn-sm">ASSIGN WORK</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Resources */}
          <div style={{ marginBottom: 24 }}>
            <div className="section-title">Resources</div>
            <div className="card">
              {KEY_RESOURCES.map(key => {
                const amount = inventory[key] ?? 0
                const meta = RESOURCE_META[key]
                return (
                  <div key={key} className="resource-row" style={{ borderBottom: key !== 'TITANIUM' ? '1px solid var(--border-dim)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{meta.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: meta.color }}>{key}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>${meta.basePrice.toFixed(4)}/unit</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-bright)' }}>
                        {formatNumber(amount)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: 12 }}>
                <Link href="/resources" className="btn btn-ghost btn-sm btn-full">View All Resources →</Link>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="section-title">Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { href: '/robots', label: '🤖 My Robots', primary: false },
              { href: '/work', label: '⚙️ Assign Work', primary: true },
              { href: '/upgrades', label: '⬆️ Upgrades', primary: false },
              { href: '/expansion', label: '🏗️ Expansion', primary: false },
              { href: '/market', label: '📊 Market', primary: false },
              { href: '/rankings', label: '🏆 Rankings', primary: false },
            ].map(action => (
              <Link key={action.href} href={action.href}
                className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 13 }}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
