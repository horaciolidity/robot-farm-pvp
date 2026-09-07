'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatNumber, formatPrice } from '@/lib/formatters'
import Link from 'next/link'

export default function MarketPage() {
  const [market, setMarket] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)

  // Sell form state
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [amount, setAmount] = useState<number | ''>('')
  const [selling, setSelling] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const t = localStorage.getItem('rf_token') ?? ''
    setToken(t)
    const headers = { Authorization: `Bearer ${t}` }
    const [mkt, inv] = await Promise.all([
      fetch('/api/market', { headers }).then(r => r.json()),
      fetch('/api/inventory', { headers }).then(r => r.json()),
    ])
    setMarket(mkt.data ?? [])
    setInventory(inv.data ?? [])
    if (!selectedKey && (mkt.data ?? []).length > 0) {
      setSelectedKey(mkt.data[0].key)
    }
    setLoading(false)
  }, [selectedKey])

  useEffect(() => { load() }, [load])

  const getInvAmount = (resourceKey: string) => {
    const r = market.find((m: any) => m.key === resourceKey)
    const item = inventory.find((i: any) => i.resourceId === r?.id)
    return item?.amount ?? 0
  }

  async function handleSell() {
    if (!amount || Number(amount) <= 0) return
    setSelling(true); setMsg('')
    try {
      const res = await fetch('/api/market/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resourceKey: selectedKey, amount: Number(amount) }),
      })
      const json = await res.json()
      if (res.ok) { setMsg('✓ ' + json.data.message); setAmount(''); load() }
      else setMsg('✗ ' + (json.error ?? 'Error'))
    } finally { setSelling(false) }
  }

  const selectedMkt = market.find(m => m.key === selectedKey)
  const owned = getInvAmount(selectedKey)
  const canSell = amount !== '' && Number(amount) > 0 && Number(amount) <= owned

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading market data...</div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Galactic Market</h1>
        <p className="page-subtitle">Real-time resource prices and trading</p>
      </div>

      <div className="grid-2">
        {/* Market Board */}
        <div>
          <div className="section-title">Live Prices</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {market.map((m, idx) => (
              <div
                key={m.key}
                onClick={() => setSelectedKey(m.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', cursor: 'pointer',
                  background: selectedKey === m.key ? 'var(--bg-elevated)' : 'transparent',
                  borderBottom: idx < market.length - 1 ? '1px solid var(--border-dim)' : 'none',
                  borderLeft: selectedKey === m.key ? '4px solid var(--accent-primary)' : '4px solid transparent',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: selectedKey === m.key ? 'var(--accent-primary)' : 'var(--text-bright)' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Owned: {formatNumber(getInvAmount(m.key))}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                    {formatPrice(m.currentPrice)}
                  </div>
                  <div style={{ fontSize: 11, color: m.priceChange24h >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {m.priceChange24h >= 0 ? '▲' : '▼'} {Math.abs(m.priceChange24h).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Console */}
        <div>
          <div className="section-title">Trading Console</div>
          {selectedMkt ? (
            <div className="card card-accent">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {selectedMkt.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 20 }}>{selectedMkt.name}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Current Price: <span style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{formatPrice(selectedMkt.currentPrice)}</span></div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>AVAILABLE TO SELL</span>
                  <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{formatNumber(owned)} {selectedMkt.symbol}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    className="input"
                    value={amount}
                    onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    min="1"
                    max={owned}
                    placeholder="Amount to sell..."
                    style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 18 }}
                  />
                  <button className="btn btn-secondary" onClick={() => setAmount(owned)}>MAX</button>
                </div>
                
                {amount !== '' && Number(amount) > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: 6, border: '1px solid rgba(34,197,94,0.2)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ESTIMATED RETURN</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-success)' }}>
                      + {formatPrice(Number(amount) * selectedMkt.currentPrice)} USDC
                    </span>
                  </div>
                )}
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
                className={`btn btn-full btn-lg ${canSell ? 'btn-primary' : 'btn-secondary'}`}
                disabled={!canSell || selling}
                onClick={handleSell}
              >
                {selling ? 'PROCESSING...' : canSell ? 'SELL RESOURCES' : 'ENTER VALID AMOUNT'}
              </button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: 'var(--text-muted)' }}>Select a resource to trade</p>
            </div>
          )}
          
          <div className="card" style={{ marginTop: 16, background: 'var(--bg-void)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <strong>Market Info:</strong> Prices fluctuate based on global supply and demand simulation. Sell high to maximize your USDC returns.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
