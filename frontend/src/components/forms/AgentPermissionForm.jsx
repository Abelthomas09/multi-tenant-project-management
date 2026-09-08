import { useCallback, useEffect, useState } from 'react'
import { errorText } from '../../utils/errors'
import { Alert, Empty } from '../common/UI'

export function AgentPermissionForm({ user, api, close }) {
  const [permissions, setPermissions] = useState([])
  const [assigned, setAssigned] = useState(new Set())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api(`/api/users/${user.id}/permissions`)
      setPermissions(data.permissions)
      setAssigned(new Set(data.assignedPermissionCodes))
      setError('')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }, [api, user.id])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const toggle = (code) =>
    setAssigned((current) => {
      const next = new Set(current)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await api(`/api/users/${user.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionCodes: [...assigned] }),
      })
      close()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="editor">
      <div>
        <h2>
          Agent permissions: {user.firstName} {user.lastName}
        </h2>
        <button onClick={close}>Close</button>
      </div>
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Empty>Loading Agent permissions…</Empty>
      ) : (
        <>
          <p className="permission-intro">
            Agents always retain project read access. Choose additional actions for this Agent.
          </p>
          <div className="permission-list">
            {permissions.map((permission) => (
              <label key={permission.code}>
                <input
                  type="checkbox"
                  checked={assigned.has(permission.code)}
                  onChange={() => toggle(permission.code)}
                />
                <span>
                  <b>{permission.code}</b>
                  <small>{permission.description}</small>
                </span>
              </label>
            ))}
          </div>
          <button className="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Agent permissions'}
          </button>
        </>
      )}
    </div>
  )
}
