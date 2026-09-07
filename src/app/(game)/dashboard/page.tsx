'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatNumber, formatDuration, progressPercent, timeUntil } from '@/lib/formatters'

function useApi(url: string) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('rf_token')
    if (!token) return
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const j = await res.json(); setData(j.data) }
    } finally { setLoading(false) }
  }, [url])

  useEffect(() => { refresh() }, [refresh])
  return { data, loading, refresh }
}

function ActiveJobCard({ robot }: { robot: any }) {
  const job = robot.jobs?.[0]
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!job || job.status === 'COLLECTED') return null
  const pct = progressPercent(job.startedAt, job.completesAt)
  const remaining = timeUntil(job.completesAt)
  const done = remaining === 0

  return (
    <div className="card" style={{ borderColor: done ? 'rgba(34,197,94,0.4)' : 'var(--border-dim)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-bright)' }}>{robot.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{robot.robotType?.name}</div>
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
        <span>⛏ Producing {job.outputResource?.name}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: avatar } = useApi('/api/avatar')
  const { data: robots } = useApi('/api/robots')
  const { data: inventory } = useApi('/api/inventory')
  const { data: market } = useApi('/api/market')

  const KEY_RESOURCES = ['IRON', 'COPPER', 'SILICON', 'ENERGY', 'TITANIUM']
  const activeRobots = (robots ?? []).filter((r: any) => r.status === 'WORKING')
  const idleRobots = (robots ?? []).filter((r: any) => r.status === 'IDLE')
  const repairRobots = (robots ?? []).filter((r: any) => r.status === 'NEEDS_REPAIR')

  const getInv = (key: string) => {
    const item = (inventory ?? []).find((i: any) => i.resource.key === key)
    return item?.amount ?? 0
  }
  const getPrice = (key: string) => {
    const item = (market ?? []).find((m: any) => m.key === key)
    return item?.currentPrice ?? 0
  }

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
                🤖 <span>{(robots ?? []).filter((r: any) => r.status !== 'RETIRED').length}</span>/{avatar.robotSlots}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status row */}
      {(repairRobots?.length > 0) && (
        <div className="card card-danger" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                {repairRobots.length} robot{repairRobots.length > 1 ? 's' : ''} need{repairRobots.length === 1 ? 's' : ''} repair
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {repairRobots.map((r: any) => r.name).join(', ')}
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
          { label: 'Active Robots', value: `${activeRobots.length}/${(robots ?? []).length}`, icon: '⚙️' },
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
            {activeRobots.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>😴</div>
                <div style={{ color: 'var(--text-muted)' }}>No active jobs</div>
                <Link href="/work" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
                  ASSIGN ROBOTS
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeRobots.map((r: any) => <ActiveJobCard key={r.id} robot={r} />)}
              </div>
            )}

            {/* Idle robots */}
            {idleRobots.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {idleRobots.map((r: any) => (
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
                const amount = getInv(key)
                const price = getPrice(key)
                const icons: Record<string, string> = { IRON: '🔩', COPPER: '🔶', SILICON: '💠', ENERGY: '⚡', TITANIUM: '🔷' }
                const colors: Record<string, string> = { IRON: 'var(--res-iron)', COPPER: 'var(--res-copper)', SILICON: 'var(--res-silicon)', ENERGY: 'var(--res-energy)', TITANIUM: 'var(--res-titanium)' }
                return (
                  <div key={key} className="resource-row" style={{ borderBottom: key !== 'TITANIUM' ? '1px solid var(--border-dim)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{icons[key]}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: colors[key] }}>{key}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>${price.toFixed(4)}/unit</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-bright)' }}>
                        {formatNumber(amount)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        ${(amount * price).toFixed(3)}
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
