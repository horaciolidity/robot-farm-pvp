'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatNumber } from '@/lib/formatters'

export default function ExpansionPage() {
  const [data, setData] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [allResources, setAllResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanding, setExpanding] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const token = localStorage.getItem('rf_token')
    const headers = { Authorization: `Bearer ${token}` }
    const [exp, inv, mkt] = await Promise.all([
      fetch('/api/expansion', { headers }).then(r => r.json()),
      fetch('/api/inventory', { headers }).then(r => r.json()),
      fetch('/api/market', { headers }).then(r => r.json()),
    ])
    setData(exp.data)
    setInventory(inv.data ?? [])
    setAllResources(mkt.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function doExpansion() {
    setExpanding(true); setMsg('')
    const token = localStorage.getItem('rf_token')
    try {
      const res = await fetch('/api/expansion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok) { setMsg('✓ ' + json.data.message); load() }
      else setMsg('✗ ' + (json.error ?? 'Error'))
    } finally { setExpanding(false) }
  }

  const getInvAmount = (resourceKey: string) => {
    const r = allResources.find((r: any) => r.key === resourceKey)
    const item = inventory.find((i: any) => i.resourceId === r?.id)
    return item?.amount ?? 0
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>

  const { current, next, maxReached } = data ?? {}

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Robot Expansion</h1>
        <p className="page-subtitle">Increase your robot fleet capacity</p>
      </div>

      {/* Current status */}
      <div className="card card-accent" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div className="stat-block">
            <span className="stat-value">{current?.robotSlots ?? 2}</span>
            <div className="stat-label">Current Slots</div>
          </div>
          <div className="stat-block">
            <span className="stat-value">{current?.currentRobots ?? 0}</span>
            <div className="stat-label">Robots Owned</div>
          </div>
          <div className="stat-block">
            <span className="stat-value">{current?.expansionLevel ?? 0}</span>
            <div className="stat-label">Expansions Done</div>
          </div>
        </div>

        {/* Slot visualization */}
        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Array.from({ length: current?.robotSlots ?? 2 }).map((_, i) => (
            <div key={i} style={{
              width: 48, height: 48, borderRadius: 10,
              background: i < (current?.currentRobots ?? 0) ? 'var(--accent-glow)' : 'var(--bg-elevated)',
              border: `1px solid ${i < (current?.currentRobots ?? 0) ? 'var(--border-bright)' : 'var(--border-dim)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {i < (current?.currentRobots ?? 0) ? '🤖' : '·'}
            </div>
          ))}
        </div>
      </div>

      {/* Next expansion */}
      {!maxReached && next ? (
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 18 }}>Expansion {next.tier}</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                Unlocks <strong style={{ color: 'var(--accent-primary)' }}>{next.slotsGranted} robot slots</strong>
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
                {current?.robotSlots} → {next.slotsGranted}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SLOTS</div>
            </div>
          </div>

          <div className="section-title">Requirements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {next.costs.map((cost: any) => {
              const have = getInvAmount(cost.resourceKey)
              const pct = Math.min(100, (have / cost.required) * 100)
              const ok = have >= cost.required

              return (
                <div key={cost.resourceKey}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                      {ok ? '✅' : '⬜'} {cost.icon} {cost.resource}
                    </span>
                    <span style={{ fontSize: 13, color: ok ? 'var(--color-success)' : 'var(--text-muted)' }}>
                      {formatNumber(have)} / {formatNumber(cost.required)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${ok ? 'success' : pct > 50 ? 'warning' : 'danger'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {msg && (
            <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13,
              background: msg.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: msg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)',
              border: `1px solid ${msg.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              {msg}
            </div>
          )}

          <button
            className={`btn btn-full btn-lg ${next.canAfford ? 'btn-primary' : 'btn-secondary'}`}
            disabled={!next.canAfford || expanding}
            onClick={doExpansion}
          >
            {expanding ? 'EXPANDING...' : next.canAfford ? `🏗️ EXECUTE EXPANSION — ${next.slotsGranted} SLOTS` : '⚠ INSUFFICIENT RESOURCES'}
          </button>
        </div>
      ) : (
        <div className="card card-success" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2>Maximum Capacity Reached</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            You've expanded to the maximum capacity. Now aim for the Combat Robot!
          </p>
        </div>
      )}

      {/* Expansion roadmap */}
      <div className="section-title">Expansion Roadmap</div>
      <div className="card">
        {[
          { tier: 0, slots: 2, label: 'Starting capacity', done: true },
          { tier: 1, slots: 4, label: 'First expansion', done: (current?.expansionLevel ?? 0) >= 1 },
          { tier: 2, slots: 6, label: 'Growing fleet', done: (current?.expansionLevel ?? 0) >= 2 },
          { tier: 3, slots: 8, label: 'Large operation', done: (current?.expansionLevel ?? 0) >= 3 },
          { tier: 4, slots: 10, label: 'Maximum capacity', done: (current?.expansionLevel ?? 0) >= 4 },
        ].map((step, idx) => (
          <div key={step.tier} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0',
            borderBottom: idx < 4 ? '1px solid var(--border-dim)' : 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%',
              background: step.done ? 'var(--accent-glow)' : 'var(--bg-elevated)',
              border: `2px solid ${step.done ? 'var(--accent-primary)' : 'var(--border-dim)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {step.done ? '✓' : step.tier}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: step.done ? 'var(--text-bright)' : 'var(--text-muted)' }}>
                {step.slots} Robot Slots
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.label}</div>
            </div>
            {step.done && <span style={{ color: 'var(--color-success)', fontSize: 13 }}>✅ Complete</span>}
            {!step.done && next?.tier === step.tier && <span className="badge badge-warning">NEXT</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
