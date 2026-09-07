'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AVATAR_TYPES = [
  {
    key: 'ENGINEER',
    emoji: '🤖',
    name: 'ENGINEER',
    desc: 'Master of robotics. Upgrades cost 5% less. Starts with extra Maintenance Kits.',
    color: '#00d4ff',
  },
  {
    key: 'COMMANDER',
    emoji: '⚔️',
    name: 'COMMANDER',
    desc: 'Born leader. Robots work 5% faster. Combat bonuses in future PvP.',
    color: '#ef4444',
  },
  {
    key: 'HACKER',
    emoji: '💻',
    name: 'HACKER',
    desc: 'Tech genius. Silicon production boosted. Market access to rare items.',
    color: '#a855f7',
  },
  {
    key: 'MERCHANT',
    emoji: '📊',
    name: 'MERCHANT',
    desc: 'Economic expert. Better market prices. More USDC on resource sales.',
    color: '#22c55e',
  },
]

export default function AvatarPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!selected || name.trim().length < 2) {
      setError('Choose an avatar type and enter a name (min. 2 characters)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), avatarType: selected }),
      })
      const json = await res.json()

      if (!res.ok) { setError(json.error ?? 'Failed'); return }
      router.push('/dashboard')
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 600, width: '100%' }} className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 className="font-display" style={{ fontSize: '1.6rem', color: 'var(--accent-primary)', letterSpacing: '0.2em' }}>
            CHOOSE YOUR IDENTITY
          </h1>
          <p className="text-secondary" style={{ marginTop: 8 }}>
            Your avatar defines your role in the Robot Farm ecosystem
          </p>
        </div>

        <div className="avatar-grid" style={{ marginBottom: 32 }}>
          {AVATAR_TYPES.map(type => (
            <button
              key={type.key}
              className={`avatar-option ${selected === type.key ? 'selected' : ''}`}
              onClick={() => setSelected(type.key)}
              style={{ background: 'none', border: selected === type.key ? `2px solid ${type.color}` : '2px solid var(--border-dim)', boxShadow: selected === type.key ? `0 0 30px ${type.color}33` : 'none' }}
            >
              <span className="avatar-emoji">{type.emoji}</span>
              <div className="avatar-type-name" style={{ color: type.color }}>{type.name}</div>
              <div className="avatar-type-desc">{type.desc}</div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="card animate-fade-in" style={{ marginBottom: 24 }}>
            <label className="label">Operator Call Sign</label>
            <input
              className="input"
              type="text"
              placeholder="Enter your name (2-20 characters)"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 16, padding: '10px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
            ⚠ {error}
          </div>
        )}

        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleCreate}
          disabled={!selected || name.trim().length < 2 || loading}
        >
          {loading ? 'DEPLOYING...' : '🚀 BEGIN OPERATION'}
        </button>

        <p className="text-center text-muted text-sm" style={{ marginTop: 16 }}>
          🎁 You'll receive a free Miner Robot to start your empire
        </p>
      </div>
    </div>
  )
}
