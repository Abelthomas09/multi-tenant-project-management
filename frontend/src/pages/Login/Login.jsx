import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Field } from '../../components/common/UI'
import { loginRequest } from '../../services/api'
import { errorText } from '../../utils/errors'
import './Login.css'

export function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const next = await loginRequest(email, password)
      onLogin(next)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <form onSubmit={submit}>
        <div className="login-top-bar">
          <Link to="/" className="back-home-link">← Back to Home</Link>
        </div>
        <div className="mark">WS</div>
        <div className="login-heading">
          <p>Welcome back</p>
          <h1>Sign in to WorkSphere</h1>
          <span>Access your projects, teams, and permissions in one place.</span>
        </div>
        {error && <Alert>{error}</Alert>}
        <Field label="Email" type="email" value={email} setValue={setEmail} />
        <Field label="Password" type="password" value={password} setValue={setPassword} />
        <button className="primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <small className="login-note">Secure workspace access</small>
      </form>
    </main>
  )
}
