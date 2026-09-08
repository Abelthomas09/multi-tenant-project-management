import { API } from '../utils/constants'

export function createApi({ token, role, tenantId, onUnauthorized }) {
  return async (path, options = {}) => {
    const { tenantScoped = true, ...fetchOptions } = options
    const headers = { ...fetchOptions.headers, Authorization: `Bearer ${token}` }
    if (fetchOptions.body) headers['Content-Type'] = 'application/json'
    if (role === 'SUPER_ADMIN' && tenantScoped) {
      if (!tenantId) throw new Error('Enter a tenant ID to access tenant data.')
      headers['X-Tenant-Id'] = tenantId
    }
    const response = await fetch(`${API}${path}`, { ...fetchOptions, headers })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 401) onUnauthorized()
      const error = new Error(payload.message)
      error.errors = payload.errors
      throw error
    }
    return payload.data
  }
}

export async function loginRequest(email, password) {
  const response = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const payload = await response.json()
  if (!response.ok) throw payload
  return { token: payload.data.token, user: payload.data.user }
}

export async function fetchMe(token) {
  const response = await fetch(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json()
  if (!response.ok) throw new Error()
  return payload.data.user
}
