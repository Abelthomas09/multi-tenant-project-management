import { useState } from 'react'
import { errorText } from '../../utils/errors'
import { Alert, Field } from '../common/UI'

export function UserForm({ user, role, api, close, saved }) {
  const isNew = !user.id
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    password: '',
    role: user.role || 'AGENT',
  })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const data = isNew
      ? form
      : {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
        }
    try {
      await api(isNew ? '/api/users' : `/api/users/${user.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        body: JSON.stringify(data),
      })
      saved()
    } catch (err) {
      setError(errorText(err))
    }
  }

  return (
    <form className="editor" onSubmit={submit}>
      <div>
        <h2>{isNew ? 'New user' : 'Edit user'}</h2>
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="fields">
        <Field
          label="First name"
          value={form.firstName}
          setValue={(firstName) => setForm({ ...form, firstName })}
        />
        <Field
          label="Last name"
          value={form.lastName}
          setValue={(lastName) => setForm({ ...form, lastName })}
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          setValue={(email) => setForm({ ...form, email })}
        />
        {isNew && (
          <Field
            label="Temporary password"
            type="password"
            value={form.password}
            setValue={(password) => setForm({ ...form, password })}
          />
        )}
        <label>
          Role
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option>AGENT</option>
            {role === 'SUPER_ADMIN' && <option>ADMIN</option>}
          </select>
        </label>
      </div>
      <button className="primary">Save user</button>
    </form>
  )
}
