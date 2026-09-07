'use client'
import { useEffect, useState } from 'react'
import { getAvatar, getRobots, saveAvatar, RESOURCE_META, Avatar } from '@/lib/game-store'
import { formatNumber } from '@/lib/formatters'

const EXPANSION_TIERS = [
  { tier: 1, slotsGranted: 4, costs: [{ resourceKey: 'IRON', amount: 1000 }, { resourceKey: 'COPPER', amount: 500 }] },
  { tier: 2, slotsGranted: 6, costs: [{ resourceKey: 'IRON', amount: 2500 }, { resourceKey: 'SILICON', amount: 500 }, { resourceKey: 'COPPER', amount: 1000 }] },
  { tier: 3, slotsGranted: 8, costs: [{ resourceKey: 'TITANIUM', amount: 200 }, { resourceKey: 'SILICON', amount: 1500 }, { resourceKey: 'IRON', amount: 5000 }] },
  { tier: 4, slotsGranted: 10, costs: [{ resourceKey: 'TITANIUM', amount: 1000 }, { resourceKey: 'SILICON', amount: 5000 }] },
]

export default function ExpansionPage() {
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [msg, setMsg] = useState('')

  function refresh() {
    setAvatar(getAvatar())
    const u = localStorage.getItem('rf_user')
    if (u) {
      const uid = JSON.parse(u).id
      try { setInventory(JSON.parse(localStorage.getItem(`rf_inventory_${uid}`) ?? '{}')) } catch {}
    }
  }

  useEffect(() => { refresh() }, [])

  function handleExpand(tier: typeof EXPANSION_TIERS[0]) {
    if (!avatar) return
    const inv = { ...inventory }
    for (const c of tier.costs) {
      if ((inv[c.resourceKey] ?? 0) < c.amount) {
        setMsg(`✗ Not enough ${RESOURCE_META[c.resourceKey]?.name}`)
        return
      }
    }
    for (const c of tier.costs) {
      inv[c.resourceKey] = (inv[c.resourceKey] ?? 0) - c.amount
    }
    const u = localStorage.getItem('rf_user')
    if (u) {
      const uid = JSON.parse(u).id
      localStorage.setItem(`rf_inventory_${uid}`, JSON.stringify(inv))
    }
    const newAvatar = { ...avatar, robotSlots: tier.slotsGranted, expansionLevel: tier.tier }
    saveAvatar(newAvatar)
    setMsg(`✓ Expanded to ${tier.slotsGranted} robot slots!`)
    refresh()
  }

  if (!avatar) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>

  const currentSlots = avatar.robotSlots
  const robots = getRobots()
  const ownedCount = robots.filter((r: any) => r.status !== 'RETIRED').length

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Expansion</h1>
        <p className="page-subtitle">Increase your robot capacity</p>
      </div>

      {/* Current status */}
      <div className="card card-accent" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>CURRENT CAPACITY</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--accent-primary)', fontWeight: 700 }}>
              {ownedCount} / {currentSlots}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>robots deployed</div>
          </div>
          <div style={{ fontSize: 48 }}>🏗️</div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="progress-bar tall">
            <div className="progress-fill" style={{ width: `${Math.min(100, (ownedCount / currentSlots) * 100)}%` }} />
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 8,
          background: msg.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)',
          border: `1px solid ${msg.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
          {msg}
        </div>
      )}

      {/* Expansion tiers */}
      <div className="section-title">Expansion Tiers</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {EXPANSION_TIERS.map(tier => {
          const isOwned = currentSlots >= tier.slotsGranted
          const isNext = !isOwned && (currentSlots === (tier.tier === 1 ? 2 : EXPANSION_TIERS[tier.tier - 2].slotsGranted))
          const canAfford = tier.costs.every(c => (inventory[c.resourceKey] ?? 0) >= c.amount)

          return (
            <div key={tier.tier} className="card"
              style={{ borderColor: isOwned ? 'rgba(34,197,94,0.3)' : isNext ? 'rgba(0,212,255,0.2)' : undefined, opacity: !isOwned && !isNext ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
                      Tier {tier.tier} Expansion
                    </span>
                    {isOwned && <span className="badge badge-working">✓ OWNED</span>}
                    {isNext && !isOwned && <span className="badge badge-idle">NEXT</span>}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {tier.slotsGranted} Robot Slots
                  </div>
                </div>
                <div style={{ fontSize: 32 }}>
                  {isOwned ? '✅' : isNext ? '🏗️' : '🔒'}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>COST</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tier.costs.map(c => {
                    const have = inventory[c.resourceKey] ?? 0
                    const ok = have >= c.amount
                    return (
                      <span key={c.resourceKey} className="resource-chip"
                        style={{ borderColor: ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)', color: ok ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {RESOURCE_META[c.resourceKey]?.icon} {formatNumber(c.amount)} {RESOURCE_META[c.resourceKey]?.name}
                        {!ok && <span style={{ fontSize: 10 }}> (have: {formatNumber(have)})</span>}
                      </span>
                    )
                  })}
                </div>
              </div>

              {isOwned ? (
                <div style={{ textAlign: 'center', color: 'var(--color-success)', fontSize: 13, fontWeight: 600 }}>
                  ✅ Already unlocked
                </div>
              ) : (
                <button
                  className={`btn btn-full ${canAfford && isNext ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={!canAfford || !isNext}
                  onClick={() => handleExpand(tier)}
                >
                  {!isNext ? '🔒 Previous tier required' : canAfford ? '🏗️ EXPAND NOW' : '⚠ INSUFFICIENT RESOURCES'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
