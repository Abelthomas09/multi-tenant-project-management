import { useCallback, useEffect, useState } from 'react'
import { Alert, Empty } from '../../components/common/UI'
import { ProjectForm } from '../../components/forms/ProjectForm'
import { statuses } from '../../utils/constants'
import { errorText } from '../../utils/errors'

export function Projects({ api, can }) {
  const [projects, setProjects] = useState([])
  const [status, setStatus] = useState('')
  const [edit, setEdit] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api(`/api/projects?pageSize=100${status ? `&status=${status}` : ''}`)
      setProjects(data.projects)
      setError('')
    } catch (e) {
      setError(errorText(e))
    } finally {
      setLoading(false)
    }
  }, [api, status])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const remove = async (project) => {
    if (!confirm(`Delete ${project.name}?`)) return
    try {
      await api(`/api/projects/${project.id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <section>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {can('projects.create') && (
          <button className="primary" onClick={() => setEdit({})}>
            New project
          </button>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      {edit && (
        <ProjectForm
          project={edit}
          api={api}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null)
            load()
          }}
        />
      )}
      {loading ? (
        <Empty>Loading projects…</Empty>
      ) : (
        <div className="grid">
          {projects.map((project) => (
            <article key={project.id}>
              <div className="card-top">
                <em className={`status ${project.status.toLowerCase()}`}>{project.status}</em>
                {can('projects.update') && (
                  <button onClick={() => setEdit(project)}>Edit</button>
                )}
              </div>
              <h2>{project.name}</h2>
              <p>{project.useCase}</p>
              <small>{project.address}</small>
              {can('projects.delete') && (
                <button className="danger" onClick={() => remove(project)}>
                  Delete
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      {!loading && !projects.length && <Empty>No projects in this tenant.</Empty>}
    </section>
  )
}
