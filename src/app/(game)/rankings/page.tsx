'use client'
import { useEffect, useState } from 'react'
import { getAvatar, getRobots, Avatar, Robot } from '@/lib/game-store'
import { formatNumber } from '@/lib/formatters'

export default function RankingsPage() {
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [robots, setRobots] = useState<Robot[]>([])

  useEffect(() => {
    setAvatar(getAvatar())
    setRobots(getRobots())
  }, [])

  if (!avatar) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>

  // In demo mode, show a mock ranking with the player at rank 1 since there's no DB
  const mockRanking = [
    { rank: 1, name: avatar.name, avatarType: avatar.avatarType, totalProduced: avatar.totalProduced, totalJobs: avatar.totalJobs, isCurrentUser: true },
    { rank: 2, name: 'SteelMiner_X', avatarType: 'ENGINEER', totalProduced: 0, totalJobs: 0, isCurrentUser: false },
    { rank: 3, name: 'CyberBot_Z', avatarType: 'HACKER', totalProduced: 0, totalJobs: 0, isCurrentUser: false },
  ]

  const typeEmoji: Record<string, string> = { ENGINEER: '🤖', COMMANDER: '⚔️', HACKER: '💻', MERCHANT: '📊' }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Rankings</h1>
        <p className="page-subtitle">Global operator standings</p>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.15)', fontSize: 13, color: 'var(--text-muted)' }}>
        🔧 Rankings are in <strong style={{ color: 'var(--accent-primary)' }}>Demo Mode</strong> — global leaderboard will be available when the database is connected.
      </div>

      {/* Your stats */}
      <div className="card card-accent" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>YOUR STATS</div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--accent-primary)', fontWeight: 700 }}>#1</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{avatar.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{avatar.avatarType} · LVL {avatar.level}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="stat-value">{formatNumber(avatar.totalProduced)}</div>
              <div className="stat-label">Produced</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="stat-value">{formatNumber(avatar.totalJobs)}</div>
              <div className="stat-label">Jobs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="stat-value">{robots.filter((r: Robot) => r.status !== 'RETIRED').length}</div>
              <div className="stat-label">Robots</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings table */}
      <div className="section-title">Leaderboard — Production</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {mockRanking.map((player, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
            borderBottom: idx < mockRanking.length - 1 ? '1px solid var(--border-dim)' : 'none',
            background: player.isCurrentUser ? 'var(--accent-glow)' : 'transparent',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, minWidth: 40, textAlign: 'center',
              color: player.rank === 1 ? '#ffd700' : player.rank === 2 ? '#c0c0c0' : player.rank === 3 ? '#cd7f32' : 'var(--text-muted)',
            }}>
              {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
            </div>
            <div style={{ fontSize: 22 }}>{typeEmoji[player.avatarType]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: player.isCurrentUser ? 'var(--accent-primary)' : 'var(--text-bright)' }}>
                {player.name} {player.isCurrentUser && <span style={{ fontSize: 11, opacity: 0.7 }}>(You)</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{player.avatarType}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{formatNumber(player.totalProduced)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>produced</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
