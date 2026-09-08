import { useState } from 'react'
import { Alert, Field } from '../../components/common/UI'
import { loginRequest } from '../../services/api'
import { errorText } from '../../utils/errors'

export function Login({ onLogin }) {
  const [email, setEmail] = useState('superadmin@example.com')
  const [password, setPassword] = useState('Password123!')
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
        <div className="mark">PM</div>
        <p>Welcome back</p>
        <h1>Sign in to your workspace</h1>
        {error && <Alert>{error}</Alert>}
        <Field label="Email" type="email" value={email} setValue={setEmail} />
        <Field label="Password" type="password" value={password} setValue={setPassword} />
        <button className="primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
