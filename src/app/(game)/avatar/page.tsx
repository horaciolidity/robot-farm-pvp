'use client'
import { useEffect, useState } from 'react'
import { getAvatar, getRobots, getJobs, Avatar, Robot } from '@/lib/game-store'
import { formatNumber } from '@/lib/formatters'

export default function AvatarGamePage() {
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [robots, setRobots] = useState<Robot[]>([])
  const [totalJobs, setTotalJobs] = useState(0)

  useEffect(() => {
    setAvatar(getAvatar())
    setRobots(getRobots())
    setTotalJobs(getJobs().filter(j => j.status === 'COLLECTED').length)
  }, [])

  if (!avatar) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>

  const typeEmoji: Record<string, string> = { ENGINEER: '🤖', COMMANDER: '⚔️', HACKER: '💻', MERCHANT: '📊' }
  const typeColor: Record<string, string> = { ENGINEER: '#00d4ff', COMMANDER: '#ef4444', HACKER: '#a855f7', MERCHANT: '#22c55e' }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Avatar</h1>
        <p className="page-subtitle">Your operator profile</p>
      </div>

      {/* Profile card */}
      <div className="card card-accent" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 16,
            background: `${typeColor[avatar.avatarType]}20`,
            border: `2px solid ${typeColor[avatar.avatarType]}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
          }}>
            {typeEmoji[avatar.avatarType]}
          </div>
          <div>
            <h2 style={{ fontSize: 22, color: 'var(--text-bright)' }}>{avatar.name}</h2>
            <div style={{ fontSize: 14, color: typeColor[avatar.avatarType], fontWeight: 600, marginTop: 4 }}>
              {avatar.avatarType}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Member since {new Date(avatar.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--accent-primary)', fontWeight: 700 }}>
              LVL {avatar.level}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Operator Level</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Produced', value: formatNumber(avatar.totalProduced), icon: '🏭' },
          { label: 'Total Jobs', value: formatNumber(avatar.totalJobs), icon: '✅' },
          { label: 'Robots Owned', value: robots.filter(r => r.status !== 'RETIRED').length, icon: '🤖' },
          { label: 'Robot Slots', value: avatar.robotSlots, icon: '🏗️' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* XP Bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>Experience</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatNumber(avatar.totalXP)} XP</span>
        </div>
        <div className="progress-bar tall">
          <div className="progress-fill" style={{ width: `${Math.min(100, (avatar.experience / 1000) * 100)}%` }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          {avatar.experience} / 1000 XP to next level
        </div>
      </div>

      {/* Class bonuses */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>Class Bonuses</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {avatar.avatarType === 'ENGINEER' && <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>🔧</span>
              <div><div style={{ fontWeight: 600 }}>Upgrade Discount</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>5% cheaper upgrades</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>🛡️</span>
              <div><div style={{ fontWeight: 600 }}>Bonus Maintenance</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>+50 Maintenance Kits on start</div></div>
            </div>
          </>}
          {avatar.avatarType === 'COMMANDER' && <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div><div style={{ fontWeight: 600 }}>Speed Bonus</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Robots work 5% faster</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>⚔️</span>
              <div><div style={{ fontWeight: 600 }}>Combat Ready</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PvP bonuses in future update</div></div>
            </div>
          </>}
          {avatar.avatarType === 'HACKER' && <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>💠</span>
              <div><div style={{ fontWeight: 600 }}>Silicon Boost</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>+150 Silicon on start</div></div>
            </div>
          </>}
          {avatar.avatarType === 'MERCHANT' && <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <div><div style={{ fontWeight: 600 }}>Market Expert</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Better market prices</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>🔩</span>
              <div><div style={{ fontWeight: 600 }}>Iron Cache</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>+200 Iron on start</div></div>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}
