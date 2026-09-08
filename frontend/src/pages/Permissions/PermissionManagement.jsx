import { useCallback, useEffect, useState } from 'react'
import { Alert, Empty } from '../../components/common/UI'
import { errorText } from '../../utils/errors'
import './PermissionSections.css'

export function PermissionManagement({ api }) {
  const [permissions, setPermissions] = useState([])
  const [assigned, setAssigned] = useState(new Set())
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api('/api/permissions/admin', { tenantScoped: false })
      setPermissions(data.permissions)
      setAssigned(new Set(data.assignedPermissionCodes))
      setError('')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }, [api])

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

  const permissionSections = [
    {
      title: 'Project Management',
      description: 'Control which project actions every Admin can perform.',
      prefix: 'projects.',
    },
    {
      title: 'User Management',
      description: 'Control which tenant users every Admin can manage.',
      prefix: 'users.',
    },
    {
      title: 'System Administration',
      description: 'Control administrative system-level capabilities.',
      prefix: 'permissions.',
    },
  ]
    .map((section) => ({
      ...section,
      permissions: permissions.filter((permission) => permission.code.startsWith(section.prefix)),
    }))
    .filter((section) => section.permissions.length)

  const save = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const data = await api('/api/permissions/admin', {
        method: 'PUT',
        body: JSON.stringify({ permissionCodes: [...assigned] }),
        tenantScoped: false,
      })
      setAssigned(new Set(data.assignedPermissionCodes))
      setMessage('Admin permissions saved. Changes apply to their next API request.')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="permission-page">
      {error && <Alert>{error}</Alert>}
      {message && <div className="success">{message}</div>}
      {loading ? (
        <Empty>Loading permissions…</Empty>
      ) : (
        <div className="editor">
          <div>
            <h2>Admin Permissions</h2>
          </div>
          <p className="permission-intro">
            Choose the permissions available to every Admin. The backend enforces these changes on
            protected routes.
          </p>
          <div className="permission-sections">
            {permissionSections.map((section) => (
              <div className="permission-section" key={section.title}>
                <div className="permission-section-heading">
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
                <div className="permission-list">
                  {section.permissions.map((permission) => (
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
              </div>
            ))}
          </div>
          <button className="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save permissions'}
          </button>
        </div>
      )}
    </section>
  )
}
