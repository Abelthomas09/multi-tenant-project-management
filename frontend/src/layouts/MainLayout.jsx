import { NavLink } from 'react-router-dom'
import { TenantPicker } from '../components/tenant/TenantPicker'
import { useAuth } from '../hooks/useAuth'

export function MainLayout({ currentPage, canManagePermissions, children }) {
  const { session, tenantId, selectTenant, logout, api, can } = useAuth()
  const title =
    currentPage === 'projects' ? 'Projects' : currentPage === 'users' ? 'Users' : 'Permission Management'

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          PM <span>Workspace</span>
        </div>
        <nav>
          {can('projects.read') && (
            <NavLink to="/projects" className={({ isActive }) => (isActive ? 'active' : '')}>
              Projects
            </NavLink>
          )}
          {can('users.read') && (
            <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
              Users
            </NavLink>
          )}
          {canManagePermissions && (
            <NavLink to="/permissions" className={({ isActive }) => (isActive ? 'active' : '')}>
              Permissions
            </NavLink>
          )}
        </nav>
        <div className="profile">
          <b>
            {session.user.firstName} {session.user.lastName}
          </b>
          <small>{session.user.email}</small>
          <em>{session.user.role.replace('_', ' ')}</em>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <p>Multi-tenant project management</p>
            <h1>{title}</h1>
          </div>
          {session.user.role === 'SUPER_ADMIN' && currentPage !== 'permissions' && (
            <TenantPicker api={api} tenantId={tenantId} selectTenant={selectTenant} />
          )}
        </header>
        {session.user.role === 'SUPER_ADMIN' && !tenantId && currentPage !== 'permissions' && (
          <div className="notice">Select or create a tenant above to access its data.</div>
        )}
        {children}
      </main>
    </div>
  )
}
