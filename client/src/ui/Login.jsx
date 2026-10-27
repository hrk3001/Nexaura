import { useState } from 'react'
import { useGame } from '../game/store.js'

const cyan = '#5eead4'

const field = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.18)',
  background: 'rgba(255,255,255,.06)',
  color: '#e6f1f7',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
}

export default function Login() {
  const login = useGame((s) => s.login)
  const register = useGame((s) => s.register)
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setPassword('')
    setConfirm('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    setError('')
    if (isRegister && password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setBusy(true)
    const result = isRegister ? await register(name, password) : await login(name, password)
    setBusy(false)
    if (!result.ok) setError(result.error)
    // on success the store moves to the landing screen by itself
  }

  const tab = (id, label) => (
    <button
      type="button"
      data-testid={`tab-${id}`}
      onClick={() => switchMode(id)}
      style={{
        flex: 1,
        padding: '10px 0',
        border: 'none',
        borderBottom: `2px solid ${mode === id ? cyan : 'transparent'}`,
        background: 'transparent',
        color: mode === id ? '#e6f1f7' : '#7d95a4',
        fontWeight: 800,
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  return (
    <main
      data-testid="login"
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'radial-gradient(1100px 600px at 50% -10%, #0b2a3a 0%, #030a14 62%)',
        color: '#e6f1f7',
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 26,
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,.12)',
          background: 'rgba(8,18,32,.85)',
          boxShadow: '0 20px 60px rgba(0,0,0,.45)',
        }}
      >
        <div style={{ letterSpacing: 3, fontSize: 12, fontWeight: 800, color: cyan }}>
          NEXAURA {'·'} INVESTIGATION UNIT
        </div>
        <h1 style={{ fontSize: 28, margin: '8px 0 4px', lineHeight: 1.15 }}>The Missing Notebook</h1>
        <p style={{ margin: '0 0 18px', color: '#9fb6c4', fontSize: 14, lineHeight: 1.5 }}>
          {isRegister
            ? 'New detective? Create an account and your case starts from the beginning.'
            : 'Welcome back, detective. Log in to continue where you left off.'}
        </p>

        <div style={{ display: 'flex', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
          {tab('login', 'Log in')}
          {tab('register', 'Create account')}
        </div>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9fb6c4', marginBottom: 6 }}>
          Detective name
        </label>
        <input
          style={field}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="username"
          id="login-name"
          name="username"
          aria-label="Detective name"
          data-testid="login-name"
          maxLength={20}
          autoFocus
        />

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9fb6c4', margin: '14px 0 6px' }}>
          Password
        </label>
        <input
          style={field}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          id="login-password"
          name="password"
          aria-label="Password"
          data-testid="login-password"
        />

        {isRegister && (
          <>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9fb6c4', margin: '14px 0 6px' }}>
              Confirm password
            </label>
            <input
              style={field}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              id="login-confirm"
              name="confirm"
              aria-label="Confirm password"
              data-testid="login-confirm"
            />
          </>
        )}

        {error && (
          <p role="alert" data-testid="login-error" style={{ margin: '14px 0 0', color: '#f87171', fontSize: 13.5, fontWeight: 700 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="nex-btn nex-primary"
          data-testid="login-submit"
          disabled={busy || !name.trim() || !password}
          style={{ width: '100%', marginTop: 18 }}
        >
          {busy ? 'Please wait…' : isRegister ? 'Create account and start' : 'Log in'}
        </button>

        <p style={{ margin: '14px 0 0', color: '#6f8797', fontSize: 12, lineHeight: 1.5 }}>
          Accounts and progress are saved in this browser.
        </p>
      </form>
    </main>
  )
}
