'use client'
import { useEffect, useState } from 'react'

export default function RewardsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  function load() {
    const token = localStorage.getItem('rf_token')
    fetch('/api/rewards', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  async function claimReward(rewardId: string) {
    const token = localStorage.getItem('rf_token')
    setMsg('')
    try {
      const res = await fetch(`/api/rewards/${rewardId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (res.ok) { setMsg('✓ ' + json.data.message); load() }
      else { setMsg('✗ ' + (json.error ?? 'Error')) }
    } catch {
      setMsg('✗ Connection error')
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading rewards...</div>

  const claimable = data.filter(r => r.status === 'AVAILABLE')
  const locked = data.filter(r => r.status === 'LOCKED')
  const claimed = data.filter(r => r.status === 'CLAIMED')

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Achievements & Rewards</h1>
        <p className="page-subtitle">Complete milestones to earn USDC and rare items</p>
      </div>

      {msg && (
        <div style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 8, fontSize: 14,
          background: msg.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)',
          border: `1px solid ${msg.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
          {msg}
        </div>
      )}

      {/* Claimable */}
      {claimable.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-title">Ready to Claim</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {claimable.map(r => (
              <div key={r.id} className="card card-accent" style={{ borderColor: 'rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>🎁</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'var(--color-success)', fontSize: 16 }}>{r.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{r.description}</p>
                </div>
                <div style={{ textAlign: 'right', paddingRight: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>REWARD</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                    +{r.rewardAmount} {r.rewardResource.name}
                  </div>
                </div>
                <button className="btn btn-success" onClick={() => claimReward(r.id)}>CLAIM REWARD</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-title">In Progress</div>
        <div className="grid-2">
          {locked.map(r => (
            <div key={r.id} className="card" style={{ opacity: 0.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15 }}>{r.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{r.description}</p>
                </div>
                <span style={{ fontSize: 24, opacity: 0.5 }}>🔒</span>
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>REWARD</span>
                <span style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 13 }}>
                  {r.rewardAmount} {r.rewardResource.name}
                </span>
              </div>
            </div>
          ))}
          {locked.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No locked achievements.</p>}
        </div>
      </div>

      {/* Claimed */}
      {claimed.length > 0 && (
        <div>
          <div className="section-title">Completed</div>
          <div className="grid-2">
            {claimed.map(r => (
              <div key={r.id} className="card" style={{ opacity: 0.5, borderColor: 'var(--border-dim)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 24 }}>✅</span>
                  <div>
                    <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{r.title}</h3>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reward claimed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
