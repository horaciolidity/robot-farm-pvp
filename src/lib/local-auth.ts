// ============================================================
// LOCAL AUTH — sin base de datos, usa localStorage
// ============================================================

export interface LocalUser {
  id: string
  username: string
  email: string
  passwordHash: string  // simple hash para no guardar en plano
  createdAt: string
}

export interface LocalSession {
  userId: string
  username: string
  email: string
}

const USERS_KEY = 'rf_users'
const SESSION_KEY = 'rf_session'

// Tiny hash (no es seguro para producción, solo para demo local)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

function getUsers(): LocalUser[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveUsers(users: LocalUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function localRegister(username: string, email: string, password: string): { ok: boolean; error?: string; session?: LocalSession } {
  const users = getUsers()

  if (users.find((u: LocalUser) => u.email === email.toLowerCase())) {
    return { ok: false, error: 'Email ya registrado' }
  }
  if (users.find((u: LocalUser) => u.username.toLowerCase() === username.toLowerCase())) {
    return { ok: false, error: 'Nombre de operador ya en uso' }
  }

  const newUser: LocalUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    username,
    email: email.toLowerCase(),
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  }

  saveUsers([...users, newUser])

  const session: LocalSession = { userId: newUser.id, username: newUser.username, email: newUser.email }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  return { ok: true, session }
}

export function localLogin(email: string, password: string): { ok: boolean; error?: string; session?: LocalSession } {
  const users = getUsers()
  const user = users.find((u: LocalUser) => u.email === email.toLowerCase())

  if (!user) return { ok: false, error: 'Email no encontrado' }
  if (user.passwordHash !== simpleHash(password)) return { ok: false, error: 'Contraseña incorrecta' }

  const session: LocalSession = { userId: user.id, username: user.username, email: user.email }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  return { ok: true, session }
}

export function localLogout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getLocalSession(): LocalSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function hasAvatar(userId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(`rf_avatar_${userId}`)
    return !!raw
  } catch {
    return false
  }
}
