'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatNumber, formatPrice } from '@/lib/formatters'

const CATEGORY_LABELS: Record<string, string> = {
  BASIC: 'Basic Materials',
  ADVANCED: 'Advanced Materials',
  RARE: 'Rare Resources',
  ENERGY: 'Energy',
  CONSUMABLE: 'Consumables',
}

export default function ResourcesPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [market, setMarket] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const token = localStorage.getItem('rf_token')
    const headers = { Authorization: `Bearer ${token}` }
    const [inv, mkt] = await Promise.all([
      fetch('/api/inventory', { headers }).then(r => r.json()),
      fetch('/api/market', { headers }).then(r => r.json()),
    ])
    setInventory(inv.data ?? [])
    setMarket(mkt.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Group by category
  const categories = ['ENERGY', 'BASIC', 'ADVANCED', 'RARE', 'CONSUMABLE']
  const byCategory = categories.map(cat => ({
    cat,
    items: inventory.filter((i: any) => i.resource.category === cat),
  })).filter(g => g.items.length > 0)

  const marketMap: Record<string, any> = {}
  market.forEach((m: any) => { marketMap[m.key] = m })

  const totalValue = inventory.reduce((sum: number, i: any) => {
    const mkt = marketMap[i.resource.key]
    return sum + (i.amount * (mkt?.currentPrice ?? 0))
  }, 0)

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Resources</h1>
            <p className="page-subtitle">Your current inventory</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-value">${totalValue.toFixed(4)}</div>
            <div className="stat-label">Total Value (USDC)</div>
          </div>
        </div>
      </div>

      {byCategory.map(({ cat, items }) => (
        <div key={cat} style={{ marginBottom: 32 }}>
          <div className="section-title">{CATEGORY_LABELS[cat] ?? cat}</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {items.map((item: any, idx: number) => {
              const mkt = marketMap[item.resource.key]
              const change = mkt?.priceChange24h ?? 0
              const value = item.amount * (mkt?.currentPrice ?? 0)

              return (
                <div key={item.id} className="resource-row" style={{
                  padding: '16px 20px',
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border-dim)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.resource.color}20`,
                      border: `1px solid ${item.resource.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {item.resource.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: item.resource.color }}>
                        {item.resource.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {item.resource.symbol} · {item.resource.description.slice(0, 50)}...
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
                    {/* Price */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{formatPrice(mkt?.currentPrice ?? 0)}</div>
                      <div style={{ fontSize: 11, color: change >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'right', minWidth: 100 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-bright)' }}>
                        {formatNumber(item.amount)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        ≈ ${value.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {inventory.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <p style={{ color: 'var(--text-muted)' }}>No resources yet. Assign robots to jobs to start producing!</p>
        </div>
      )}
    </div>
  )
}
