'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { localRegister } from '@/lib/local-auth'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = localRegister(form.username, form.email, form.password)

    if (!result.ok) {
      setError(result.error ?? 'Registration failed')
      setLoading(false)
      return
    }

    // Guardar también en formato legacy para compatibilidad con el resto del juego
    localStorage.setItem('rf_token', `local_${result.session!.userId}`)
    localStorage.setItem('rf_user', JSON.stringify({
      id: result.session!.userId,
      username: result.session!.username,
      email: result.session!.email,
    }))

    router.push('/avatar')
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-logo">
          <h1>ROBOT FARM</h1>
          <p className="text-muted text-sm" style={{ marginTop: 8, letterSpacing: '0.1em' }}>
            OPERATOR REGISTRATION
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Operator Name</label>
            <input
              className="input"
              type="text"
              placeholder="CyberMiner_X"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required minLength={2}
            />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="operator@robotfarm.io"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required minLength={6}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 16, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠ {error}
            </div>
          )}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="divider" />
        <p className="text-center text-muted text-sm">
          Already registered?{' '}
          <Link href="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Login
          </Link>
        </p>

        <div className="card" style={{ marginTop: 24, background: 'var(--accent-glow)' }}>
          <p className="text-sm text-secondary" style={{ textAlign: 'center' }}>
            🎁 <strong style={{ color: 'var(--accent-primary)' }}>Starter Pack:</strong> 500 Iron · 200 Energy · 100 Copper + 1 Free Miner Robot
          </p>
        </div>
      </div>
    </div>
  )
}
