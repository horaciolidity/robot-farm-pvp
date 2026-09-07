'use client'
import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/formatters'

export default function RankingsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('rf_token')
    fetch('/api/rankings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading rankings...</div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Global Rankings</h1>
        <p className="page-subtitle">Compete with operators across the galaxy</p>
      </div>

      <div className="grid-2">
        {/* Level Rankings */}
        <div>
          <div className="section-title">Top by Level (XP)</div>
          <div className="card" style={{ padding: 0 }}>
            {data?.byLevel.map((user: any, i: number) => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: i < 9 ? '1px solid var(--border-dim)' : 'none' }}>
                <div style={{ width: 28, textAlign: 'center', fontSize: 16, fontWeight: 700, color: i === 0 ? '#facc15' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'var(--text-muted)' }}>
                  {i === 0 ? '👑' : `#${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.avatarType}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>LVL {user.level}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatNumber(user.experience)} XP</div>
                </div>
              </div>
            ))}
            {data?.byLevel.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No operators yet</div>}
          </div>
        </div>

        {/* Wealth Rankings */}
        <div>
          <div className="section-title">Top by Wealth (USDC)</div>
          <div className="card" style={{ padding: 0 }}>
            {data?.byWealth.map((user: any, i: number) => (
              <div key={user.userId} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: i < 9 ? '1px solid var(--border-dim)' : 'none' }}>
                <div style={{ width: 28, textAlign: 'center', fontSize: 16, fontWeight: 700, color: i === 0 ? '#facc15' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'var(--text-muted)' }}>
                  {i === 0 ? '💎' : `#${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{user.user.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-success)', fontWeight: 700 }}>
                    ${formatNumber(user.amount)}
                  </div>
                </div>
              </div>
            ))}
            {data?.byWealth.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No data available</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
