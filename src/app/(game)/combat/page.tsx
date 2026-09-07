'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatNumber } from '@/lib/formatters'

export default function CombatPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('rf_token')
    fetch('/api/combat/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading combat telemetry...</div>

  const { isUnlocked, levelRequirement, currentLevel, titaniumCost, titaniumOwned } = data

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">PvP Combat Arena</h1>
        <p className="page-subtitle">Raid other operators and defend your resources</p>
      </div>

      {!isUnlocked ? (
        <div className="locked-overlay" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="card" style={{ padding: 0, border: 'none' }}>
            <div style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)' }}>
              <div style={{ fontSize: 64, marginBottom: 24, filter: 'grayscale(1)', opacity: 0.5 }}>⚔️</div>
              <h2 style={{ fontSize: 24, marginBottom: 8, color: 'var(--text-muted)' }}>COMBAT MODULE LOCKED</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 32px' }}>
                Your current operation is too small to engage in interstellar combat. Meet the requirements below to unlock the combat module.
              </p>

              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 16, textAlign: 'left', background: 'var(--bg-elevated)', padding: 24, borderRadius: 16, border: '1px solid var(--border-dim)' }}>
                <h3 style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>UNLOCK REQUIREMENTS</h3>
                
                {/* Level Req */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                    <span style={{ color: currentLevel >= levelRequirement ? 'var(--color-success)' : 'var(--text-bright)' }}>
                      {currentLevel >= levelRequirement ? '✅' : '⬜'} Operator Level {levelRequirement}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{currentLevel}/{levelRequirement}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${currentLevel >= levelRequirement ? 'success' : 'warning'}`} style={{ width: `${Math.min(100, (currentLevel/levelRequirement)*100)}%` }} />
                  </div>
                </div>

                {/* Titanium Req */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                    <span style={{ color: titaniumOwned >= titaniumCost ? 'var(--color-success)' : 'var(--text-bright)' }}>
                      {titaniumOwned >= titaniumCost ? '✅' : '⬜'} 🔷 Titanium Plating
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{formatNumber(titaniumOwned)}/{formatNumber(titaniumCost)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${titaniumOwned >= titaniumCost ? 'success' : 'warning'}`} style={{ width: `${Math.min(100, (titaniumOwned/titaniumCost)*100)}%` }} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 32 }}>
                <Link href="/dashboard" className="btn btn-secondary">RETURN TO DASHBOARD</Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card card-accent" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🚀</div>
          <h2 style={{ fontSize: 24, color: 'var(--accent-primary)', marginBottom: 16 }}>COMBAT MODULE UNLOCKED</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 32px' }}>
            Congratulations, Operator. You have met all requirements. The PvP arena is currently being prepared for deployment. You will be able to raid other operators' reserves and deploy defense robots soon.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600, margin: '0 auto', textAlign: 'left' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🛡️</div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>Base Defense</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Assign Combat Robots to protect your resources while you are offline.</p>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚔️</div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>Offensive Raids</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Send Combat Robots to steal unprotected resources from rival players.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
