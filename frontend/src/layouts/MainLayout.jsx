import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { TenantPicker } from '../components/tenant/TenantPicker'
import { useAuth } from '../hooks/useAuth'

export function MainLayout({ currentPage, canManagePermissions, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { session, tenantId, selectTenant, logout, api, can } = useAuth()
  const title =
    currentPage === 'projects' ? 'Projects' : currentPage === 'users' ? 'Users' : 'Permission Management'

  return (
    <div className={`shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside>
        <div className="brand">
          PM <span>Workspace</span>
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
        <nav>
          {can('projects.read') && (
            <NavLink to="/projects" title="Projects" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M3.5 6.5h6l1.8 2H20a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-10a1 1 0 0 1 .5-1Z" /></svg>
              </span>
              <span className="nav-label">Projects</span>
            </NavLink>
          )}
          {can('users.read') && (
            <NavLink to="/users" title="Users" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 10l1.3 1.3L21 8.5M16 17.5h5" /></svg>
              </span>
              <span className="nav-label">Users</span>
            </NavLink>
          )}
          {canManagePermissions && (
            <NavLink to="/permissions" title="Permissions" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 3 5.5 6v5.2c0 4.2 2.7 7.8 6.5 9.3 3.8-1.5 6.5-5.1 6.5-9.3V6L12 3Zm-2.2 9.2 1.5 1.5 3.2-3.3" /></svg>
              </span>
              <span className="nav-label">Permissions</span>
            </NavLink>
          )}
        </nav>
        <div className="profile">
          <div className="profile-identity">
            <span className="profile-avatar" aria-hidden="true">
              {session.user.firstName?.[0]}{session.user.lastName?.[0]}
            </span>
            <div>
              <b>
                {session.user.firstName} {session.user.lastName}
              </b>
              <small>{session.user.email}</small>
            </div>
          </div>
          <em>{session.user.role.replace('_', ' ')}</em>
          <button className="profile-signout" onClick={logout} aria-label="Sign out" title="Sign out">
            <span className="signout-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 16l4-4-4-4M9 12h9" /></svg>
            </span>
            <span>Sign out</span>
          </button>
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
