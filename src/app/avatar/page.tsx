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

// Inventario inicial según tipo de avatar
function getStarterInventory(avatarType: string) {
  const base = { IRON: 500, ENERGY: 200, COPPER: 100, SILICON: 50, TITANIUM: 0, FOOD: 100, MAINTENANCE: 30 }
  if (avatarType === 'ENGINEER') base.MAINTENANCE += 50
  if (avatarType === 'HACKER') base.SILICON += 150
  if (avatarType === 'MERCHANT') base.IRON += 200
  return base
}

// Robot inicial
function getStarterRobot(userId: string) {
  return {
    id: `robot_${Date.now()}`,
    userId,
    name: 'Miner Bot MK-I',
    robotTypeKey: 'MINER',
    status: 'IDLE',
    level: 1,
    experience: 0,
    durability: 100,
    lifetimeWear: 0,
    upgradeProduction: 0,
    upgradeEfficiency: 0,
    upgradeEnergyCapacity: 0,
    upgradeDurability: 0,
    upgradeSpeed: 0,
    createdAt: new Date().toISOString(),
  }
}

export default function AvatarPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleCreate() {
    if (!selected || name.trim().length < 2) {
      setError('Choose an avatar type and enter a name (min. 2 characters)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const userRaw = localStorage.getItem('rf_user')
      const user = userRaw ? JSON.parse(userRaw) : null
      if (!user) { setError('Session not found. Please register again.'); setLoading(false); return }

      const avatar = {
        id: `avatar_${Date.now()}`,
        userId: user.id,
        name: name.trim(),
        avatarType: selected,
        level: 1,
        experience: 0,
        totalXP: 0,
        robotSlots: 2,
        expansionLevel: 0,
        totalProduced: 0,
        totalJobs: 0,
        totalUpgrades: 0,
        createdAt: new Date().toISOString(),
      }

      // Guardar avatar
      localStorage.setItem(`rf_avatar_${user.id}`, JSON.stringify(avatar))

      // Guardar inventario inicial
      const inventory = getStarterInventory(selected)
      localStorage.setItem(`rf_inventory_${user.id}`, JSON.stringify(inventory))

      // Guardar robot inicial
      const robot = getStarterRobot(user.id)
      const robots = [robot]
      localStorage.setItem(`rf_robots_${user.id}`, JSON.stringify(robots))

      router.push('/dashboard')
    } catch {
      setError('Error creating avatar')
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
          🎁 You&apos;ll receive a free Miner Robot to start your empire
        </p>
      </div>
    </div>
  )
}
