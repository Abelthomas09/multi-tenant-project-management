import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createApi, fetchMe } from '../services/api'
import { readSession } from '../utils/session'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [session, setSession] = useState(readSession)
  const [ready, setReady] = useState(!session)
  const [tenantId, setTenantId] = useState(() => localStorage.getItem('pm_tenant_id') || '')
  const sessionToken = session?.token

  const logout = useCallback(() => {
    localStorage.removeItem('pm_session')
    setSession(null)
    navigate('/login')
  }, [navigate])

  const login = useCallback(
    (next) => {
      localStorage.setItem('pm_session', JSON.stringify(next))
      setSession(next)
      navigate('/projects')
    },
    [navigate],
  )

  const selectTenant = useCallback((value) => {
    setTenantId(value)
    localStorage.setItem('pm_tenant_id', value)
  }, [])

  const api = useMemo(
    () =>
      createApi({
        token: session?.token,
        role: session?.user?.role,
        tenantId,
        onUnauthorized: logout,
      }),
    [session, tenantId, logout],
  )

  useEffect(() => {
    if (!sessionToken) return
    const timer = setTimeout(async () => {
      try {
        const user = await fetchMe(sessionToken)
        const next = { token: sessionToken, user }
        localStorage.setItem('pm_session', JSON.stringify(next))
        setSession(next)
      } catch {
        logout()
      } finally {
        setReady(true)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [sessionToken, logout])

  const can = useCallback(
    (permission) => session?.user?.permissions?.includes(permission) ?? false,
    [session],
  )

  const value = useMemo(
    () => ({ session, ready, tenantId, login, logout, selectTenant, api, can }),
    [session, ready, tenantId, login, logout, selectTenant, api, can],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
