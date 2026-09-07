// Number formatting
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(n < 10 ? 2 : 0)
}

export function formatPrice(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(3)}`
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

// Time formatting
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function timeUntil(date: Date | string): number {
  const target = new Date(date).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((target - now) / 1000))
}

export function progressPercent(startedAt: Date | string, completesAt: Date | string): number {
  const start = new Date(startedAt).getTime()
  const end = new Date(completesAt).getTime()
  const now = Date.now()
  const total = end - start
  if (total <= 0) return 100
  const elapsed = now - start
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

// XP and leveling
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export function levelFromXP(totalXP: number): { level: number; xpIntoLevel: number; xpForNext: number } {
  let level = 1
  let xpUsed = 0
  while (true) {
    const needed = xpForLevel(level)
    if (xpUsed + needed > totalXP) {
      return { level, xpIntoLevel: totalXP - xpUsed, xpForNext: needed }
    }
    xpUsed += needed
    level++
  }
}
