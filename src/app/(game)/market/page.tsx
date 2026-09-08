'use client'
import { useEffect, useState } from 'react'
import { getInventory, RESOURCE_META } from '@/lib/game-store'
import { formatNumber } from '@/lib/formatters'

import { toast } from 'sonner'

export default function MarketPage() {
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [selectedKey, setSelectedKey] = useState<string>('IRON')
  const [tradeAmount, setTradeAmount] = useState('')

  useEffect(() => { setInventory(getInventory()) }, [])

  const tradeableKeys = Object.keys(RESOURCE_META)
  const selectedMeta = RESOURCE_META[selectedKey]
  const have = inventory[selectedKey] ?? 0
  const amount = parseFloat(tradeAmount) || 0
  const value = amount * (selectedMeta?.basePrice ?? 0)

  function handleSell() {
    if (amount <= 0 || amount > have) { toast.error('Invalid amount'); return }
    const inv = getInventory()
    inv[selectedKey] = (inv[selectedKey] ?? 0) - amount
    // Add USDC equivalent as IRON for now (simplification)
    toast.success(`Sold ${formatNumber(amount)} ${selectedMeta?.name} for $${value.toFixed(4)} USDC`)
    const { default: ls } = { default: localStorage }
    const userRaw = ls.getItem('rf_user')
    if (userRaw) {
      const user = JSON.parse(userRaw)
      ls.setItem(`rf_inventory_${user.id}`, JSON.stringify(inv))
    }
    setInventory({ ...inv })
    setTradeAmount('')
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Market</h1>
        <p className="page-subtitle">Trade resources for USDC</p>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.15)', fontSize: 13, color: 'var(--text-muted)' }}>
        🔧 Market is in <strong style={{ color: 'var(--accent-primary)' }}>Demo Mode</strong> — prices are fixed. Full dynamic market with order book coming soon when database is connected.
      </div>

      <div className="grid-2">
        {/* Resource list */}
        <div>
          <div className="section-title">Resources</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {tradeableKeys.map((key, idx) => {
              const meta = RESOURCE_META[key]
              const amt = inventory[key] ?? 0
              return (
                <button key={key}
                  onClick={() => { setSelectedKey(key); setTradeAmount('') }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    background: selectedKey === key ? 'var(--accent-glow)' : 'transparent',
                    border: 'none', borderBottom: idx < tradeableKeys.length - 1 ? '1px solid var(--border-dim)' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                    borderLeft: selectedKey === key ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  }}>
                  <span style={{ fontSize: 22 }}>{meta.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: meta.color, fontSize: 14 }}>{meta.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>${meta.basePrice.toFixed(4)}/unit</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-bright)' }}>{formatNumber(amt)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>in stock</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Trade panel */}
        <div>
          <div className="section-title">Trade: {selectedMeta?.name}</div>
          <div className="card">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 36 }}>{selectedMeta?.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: selectedMeta?.color }}>{selectedMeta?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You have: {formatNumber(have)} units</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>BUY PRICE</div>
                <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: 16 }}>${(selectedMeta?.basePrice * 1.05).toFixed(4)}</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SELL PRICE</div>
                <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 16 }}>${selectedMeta?.basePrice.toFixed(4)}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Amount to Sell</label>
              <input
                className="input"
                type="number"
                min="0"
                max={have}
                value={tradeAmount}
                onChange={e => { setTradeAmount(e.target.value) }}
                placeholder="0"
              />
            </div>

            {amount > 0 && (
              <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>You will receive:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>${value.toFixed(4)} USDC</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-success btn-full"
                disabled={amount <= 0 || amount > have}
                onClick={handleSell}
              >
                💵 SELL {amount > 0 ? formatNumber(amount) : ''} {selectedMeta?.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
