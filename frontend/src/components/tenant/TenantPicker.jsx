import { useCallback, useEffect, useState } from 'react'
import { errorText } from '../../utils/errors'
import './TenantPicker.css'

export function TenantPicker({ api, tenantId, selectTenant }) {
  const [tenants, setTenants] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api('/api/tenants', { tenantScoped: false })
      setTenants(data.tenants)
      setError('')
    } catch (err) {
      setError(errorText(err))
    }
  }, [api])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const create = async (event) => {
    event.preventDefault()
    setCreating(true)
    setError('')
    try {
      const data = await api('/api/tenants', {
        method: 'POST',
        body: JSON.stringify({ name }),
        tenantScoped: false,
      })
      setTenants((current) =>
        [...current, data.tenant].sort((a, b) => a.name.localeCompare(b.name)),
      )
      selectTenant(data.tenant.id)
      setName('')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="tenant-picker">
      <label className="tenant">
        Tenant
        <select value={tenantId} onChange={(e) => selectTenant(e.target.value)}>
          <option value="">Select a tenant</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </label>
      <form onSubmit={create}>
        <input
          aria-label="New tenant name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New company name"
          required
        />
        <button disabled={creating}>{creating ? 'Creating…' : 'Add tenant'}</button>
      </form>
      {error && <small className="tenant-error">{error}</small>}
    </div>
  )
}
