'use client'
import { useEffect, useState } from 'react'
import { getAvatar, addInventory, Avatar } from '@/lib/game-store'

const ACHIEVEMENTS = [
  { key: 'FIRST_JOB', title: 'First Steps', desc: 'Complete your first job', icon: '⚙️', xp: 50, reward: { resourceKey: 'IRON', amount: 100 }, condition: (av: Avatar) => av.totalJobs >= 1 },
  { key: 'JOB_10', title: 'Getting Started', desc: 'Complete 10 jobs', icon: '🔧', xp: 100, reward: { resourceKey: 'COPPER', amount: 50 }, condition: (av: Avatar) => av.totalJobs >= 10 },
  { key: 'JOB_50', title: 'Hardworker', desc: 'Complete 50 jobs', icon: '💪', xp: 250, reward: { resourceKey: 'SILICON', amount: 30 }, condition: (av: Avatar) => av.totalJobs >= 50 },
  { key: 'PRODUCE_100', title: 'Manufacturer', desc: 'Produce 100 total resources', icon: '🏭', xp: 150, reward: { resourceKey: 'ENERGY', amount: 200 }, condition: (av: Avatar) => av.totalProduced >= 100 },
  { key: 'PRODUCE_1000', title: 'Industrial', desc: 'Produce 1,000 total resources', icon: '🏗️', xp: 500, reward: { resourceKey: 'IRON', amount: 500 }, condition: (av: Avatar) => av.totalProduced >= 1000 },
]

import { toast } from 'sonner'

export default function RewardsPage() {
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [claimed, setClaimed] = useState<string[]>([])

  function refresh() {
    const av = getAvatar()
    setAvatar(av)
    const u = localStorage.getItem('rf_user')
    if (u) {
      const uid = JSON.parse(u).id
      try { setClaimed(JSON.parse(localStorage.getItem(`rf_claimed_${uid}`) ?? '[]')) } catch {}
    }
  }

  useEffect(() => { refresh() }, [])

  function handleClaim(key: string, reward: { resourceKey: string; amount: number }) {
    addInventory(reward.resourceKey, reward.amount)
    const u = localStorage.getItem('rf_user')
    if (u) {
      const uid = JSON.parse(u).id
      const newClaimed = [...claimed, key]
      localStorage.setItem(`rf_claimed_${uid}`, JSON.stringify(newClaimed))
      setClaimed(newClaimed)
    }
    toast.success(`Claimed! ${reward.amount} ${reward.resourceKey} added to inventory.`)
  }

  if (!avatar) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>

  const claimable = ACHIEVEMENTS.filter(a => !claimed.includes(a.key) && a.condition(avatar))
  const locked = ACHIEVEMENTS.filter(a => !claimed.includes(a.key) && !a.condition(avatar))
  const claimedList = ACHIEVEMENTS.filter(a => claimed.includes(a.key))

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Rewards</h1>
        <p className="page-subtitle">Claim your achievement rewards</p>
      </div>

      {/* Claimable */}
      {claimable.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-title">🎉 Ready to Claim ({claimable.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {claimable.map(a => (
              <div key={a.key} className="card" style={{ borderColor: 'rgba(34,197,94,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 36 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 4 }}>
                      🎁 {a.reward.amount} {a.reward.resourceKey} · +{a.xp} XP
                    </div>
                  </div>
                  <button className="btn btn-success" onClick={() => handleClaim(a.key, a.reward)}>
                    CLAIM
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-title">🔒 Locked ({locked.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {locked.map(a => (
              <div key={a.key} className="card" style={{ opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 36, filter: 'grayscale(1)' }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-muted)' }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      🎁 {a.reward.amount} {a.reward.resourceKey} · +{a.xp} XP
                    </div>
                  </div>
                  <span className="badge badge-locked">🔒 LOCKED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claimed */}
      {claimedList.length > 0 && (
        <div>
          <div className="section-title">✅ Claimed ({claimedList.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {claimedList.map(a => (
              <div key={a.key} className="card" style={{ opacity: 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 36 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</div>
                  </div>
                  <span className="badge badge-working">✓ CLAIMED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
