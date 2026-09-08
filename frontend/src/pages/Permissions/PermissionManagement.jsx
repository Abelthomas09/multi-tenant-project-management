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
  const [activeSection, setActiveSection] = useState('projects.')

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

  const permissionLabel = (code) => {
    const [resource, action] = code.split('.')
    const actions = { create: 'Create', delete: 'Delete', read: 'View', update: 'Edit', disable: 'Disable', manage: 'Manage' }
    const resources = { projects: 'Project', users: 'User', permissions: 'Permissions' }
    return `${actions[action] || action} ${resources[resource] || resource}`
  }

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

  const selectedSection =
    permissionSections.find((section) => section.prefix === activeSection) || permissionSections[0]

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
            <div className="permission-section-tabs" role="tablist" aria-label="Permission categories">
              {permissionSections.map((section) => (
                <button
                  className={section.prefix === selectedSection?.prefix ? 'active' : ''}
                  key={section.title}
                  onClick={() => setActiveSection(section.prefix)}
                  role="tab"
                  aria-selected={section.prefix === selectedSection?.prefix}
                >
                  <span>{section.title}</span>
                </button>
              ))}
            </div>
            {selectedSection && (
              <div className="permission-section">
                <div className="permission-list">
                  {selectedSection.permissions.map((permission) => (
                    <label key={permission.code}>
                      <input
                        type="checkbox"
                        checked={assigned.has(permission.code)}
                        onChange={() => toggle(permission.code)}
                      />
                      <span>
                        <b>{permissionLabel(permission.code)}</b>
                        <small>{permission.description}</small>
                      </span>
                    </label>
                  ))}
                  {!selectedSection.permissions.length && <Empty>No permissions in this category.</Empty>}
                </div>
              </div>
            )}
          </div>
          <div className="permission-actions">
            <span>Changes apply to all Admins in this tenant.</span>
            <button className="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save permissions'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
