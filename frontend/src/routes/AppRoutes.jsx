import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { MainLayout } from '../layouts/MainLayout'
import { Login } from '../pages/Login/Login'
import { PermissionManagement } from '../pages/Permissions/PermissionManagement'
import { Projects } from '../pages/Projects/Projects'
import { Users } from '../pages/Users/Users'

export function AppRoutes() {
  const { session, ready, login, api, can } = useAuth()

  if (!ready) return <main className="loading">Checking your session…</main>

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const canManagePermissions = session.user.role === 'SUPER_ADMIN' && can('permissions.manage')
  const defaultPath = can('projects.read') ? '/projects' : can('users.read') ? '/users' : '/permissions'

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={defaultPath} replace />} />

      {can('projects.read') && (
        <Route
          path="/projects"
          element={
            <MainLayout currentPage="projects" canManagePermissions={canManagePermissions}>
              <Projects api={api} can={can} />
            </MainLayout>
          }
        />
      )}

      {can('users.read') && (
        <Route
          path="/users"
          element={
            <MainLayout currentPage="users" canManagePermissions={canManagePermissions}>
              <Users api={api} can={can} role={session.user.role} />
            </MainLayout>
          }
        />
      )}

      {canManagePermissions && (
        <Route
          path="/permissions"
          element={
            <MainLayout currentPage="permissions" canManagePermissions={canManagePermissions}>
              <PermissionManagement api={api} />
            </MainLayout>
          }
        />
      )}

      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  )
}
