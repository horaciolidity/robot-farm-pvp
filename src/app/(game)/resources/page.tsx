'use client'
import { useEffect, useState } from 'react'
import { getInventory, RESOURCE_META } from '@/lib/game-store'
import { formatNumber } from '@/lib/formatters'

const CATEGORY_LABELS: Record<string, string> = {
  BASIC: 'Basic Materials',
  ADVANCED: 'Advanced Materials',
  RARE: 'Rare Resources',
  ENERGY: 'Energy',
  CONSUMABLE: 'Consumables',
}

const RESOURCE_CATEGORIES: Record<string, string> = {
  IRON: 'BASIC', COPPER: 'BASIC', FOOD: 'CONSUMABLE',
  SILICON: 'ADVANCED', ENERGY: 'ENERGY', TITANIUM: 'RARE', MAINTENANCE: 'CONSUMABLE',
}

export default function ResourcesPage() {
  const [inventory, setInventory] = useState<Record<string, number>>({})

  function refresh() { setInventory(getInventory()) }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [])

  const allKeys = Object.keys(RESOURCE_META)
  const categories = ['ENERGY', 'BASIC', 'ADVANCED', 'RARE', 'CONSUMABLE']

  const totalValue = allKeys.reduce((sum, key) => {
    return sum + (inventory[key] ?? 0) * (RESOURCE_META[key]?.basePrice ?? 0)
  }, 0)

  const byCategory = categories.map(cat => ({
    cat,
    items: allKeys.filter(k => RESOURCE_CATEGORIES[k] === cat && (inventory[k] ?? 0) > 0),
  })).filter(g => g.items.length > 0)

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

      {byCategory.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <p style={{ color: 'var(--text-muted)' }}>No resources yet. Assign robots to jobs to start producing!</p>
        </div>
      )}

      {byCategory.map(({ cat, items }) => (
        <div key={cat} style={{ marginBottom: 32 }}>
          <div className="section-title">{CATEGORY_LABELS[cat] ?? cat}</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {items.map((key, idx) => {
              const meta = RESOURCE_META[key]
              const amount = inventory[key] ?? 0
              const value = amount * meta.basePrice
              return (
                <div key={key} className="resource-row" style={{
                  padding: '16px 20px',
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border-dim)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}20`,
                      border: `1px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {meta.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: meta.color }}>{meta.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{key}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>${meta.basePrice.toFixed(4)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>base price</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 100 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-bright)' }}>
                        {formatNumber(amount)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>≈ ${value.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
