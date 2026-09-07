'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',  icon: '🏠', label: 'Dashboard',   section: 'main' },
  { href: '/avatar',     icon: '👤', label: 'My Avatar',   section: 'main' },
  { href: '/robots',     icon: '🤖', label: 'My Robots',   section: 'main' },
  { href: '/work',       icon: '⚙️', label: 'Work',        section: 'main' },
  { href: '/resources',  icon: '📦', label: 'Resources',   section: 'economy' },
  { href: '/upgrades',   icon: '⬆️', label: 'Upgrades',   section: 'economy' },
  { href: '/market',     icon: '📊', label: 'Market',      section: 'economy' },
  { href: '/expansion',  icon: '🏗️', label: 'Expansion',  section: 'economy' },
  { href: '/rankings',   icon: '🏆', label: 'Rankings',    section: 'social' },
  { href: '/rewards',    icon: '🎖️', label: 'Rewards',    section: 'social' },
  { href: '/combat',     icon: '⚔️', label: 'Combat',     section: 'future', locked: true },
]

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [avatar, setAvatar] = useState<any>(null)
  const [robots, setRobots] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('rf_token')
    if (!token) { router.push('/login'); return }

    async function load() {
      try {
        const [avatarRes, robotsRes] = await Promise.all([
          fetch('/api/avatar', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/robots', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (avatarRes.ok) { const d = await avatarRes.json(); setAvatar(d.data) }
        if (robotsRes.ok) { const d = await robotsRes.json(); setRobots(d.data) }
      } catch {}
    }
    load()
    // Refresh every 30 seconds
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [router])

  function handleLogout() {
    localStorage.removeItem('rf_token')
    localStorage.removeItem('rf_user')
    router.push('/login')
  }

  const sections = [
    { key: 'main', label: 'Operations' },
    { key: 'economy', label: 'Economy' },
    { key: 'social', label: 'Network' },
    { key: 'future', label: 'Future' },
  ]

  const activeRobots = robots.filter(r => r.status === 'WORKING').length

  return (
    <div className="game-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>ROBOT FARM</h1>
          <div className="tagline">BUILD YOUR EMPIRE</div>
        </div>

        {/* Avatar mini-profile */}
        {avatar && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid var(--border-dim)' }}>
                {avatar.avatarType === 'ENGINEER' ? '🤖' : avatar.avatarType === 'COMMANDER' ? '⚔️' : avatar.avatarType === 'HACKER' ? '💻' : '📊'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>{avatar.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--accent-primary)' }}>LVL {avatar.level}</span>
                  <span>·</span>
                  <span>🤖 {robots.filter(r => r.status !== 'RETIRED').length}/{avatar.robotSlots}</span>
                </div>
              </div>
            </div>
            {activeRobots > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="status-dot working"></span>
                {activeRobots} robot{activeRobots > 1 ? 's' : ''} working
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sections.map(section => {
            const items = NAV_ITEMS.filter(n => n.section === section.key)
            return (
              <div key={section.key} className="nav-section">
                <div className="nav-section-label">{section.label}</div>
                {items.map(item => (
                  <Link
                    key={item.href}
                    href={item.locked ? '#' : item.href}
                    className={`nav-link ${pathname === item.href ? 'active' : ''} ${item.locked ? 'locked-nav' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                    {item.locked && <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }}>🔒</span>}
                  </Link>
                ))}
              </div>
            )
          })}
        </div>

        {/* Logout */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border-dim)' }}>
          <button className="btn btn-ghost btn-full btn-sm" onClick={handleLogout}>
            ← Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
