import { useCallback, useEffect, useState } from 'react'
import { Alert, Empty } from '../../components/common/UI'
import { AgentPermissionForm } from '../../components/forms/AgentPermissionForm'
import { UserForm } from '../../components/forms/UserForm'
import { errorText } from '../../utils/errors'

export function Users({ api, can, role }) {
  const [users, setUsers] = useState([])
  const [edit, setEdit] = useState(null)
  const [permissionUser, setPermissionUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api('/api/users?pageSize=100')
      setUsers(data.users)
      setError('')
    } catch (e) {
      setError(errorText(e))
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const toggle = async (user) => {
    try {
      await api(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      load()
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <section>
      <div className="toolbar">
        {can('users.create') && (
          <button className="primary" onClick={() => setEdit({})}>
            New user
          </button>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      {edit && (
        <UserForm
          user={edit}
          role={role}
          api={api}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null)
            load()
          }}
        />
      )}
      {permissionUser && (
        <AgentPermissionForm
          user={permissionUser}
          api={api}
          close={() => setPermissionUser(null)}
        />
      )}
      {loading ? (
        <Empty>Loading users…</Empty>
      ) : (
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <b>
                      {user.firstName} {user.lastName}
                    </b>
                    <small>{user.email}</small>
                  </td>
                  <td>
                    <em>{user.role}</em>
                  </td>
                  <td>{user.isActive ? 'Active' : 'Disabled'}</td>
                  <td>
                    {can('users.update') && (
                      <button onClick={() => setEdit(user)}>Edit</button>
                    )}{' '}
                    {can('users.disable') && (
                      <button onClick={() => toggle(user)}>
                        {user.isActive ? 'Disable' : 'Enable'}
                      </button>
                    )}{' '}
                    {role === 'SUPER_ADMIN' &&
                      user.role === 'AGENT' &&
                      can('permissions.manage') && (
                        <button onClick={() => setPermissionUser(user)}>Permissions</button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && <Empty>No users in this tenant.</Empty>}
        </div>
      )}
    </section>
  )
}
