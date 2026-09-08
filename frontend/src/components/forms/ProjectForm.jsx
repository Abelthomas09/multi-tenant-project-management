import { useState } from 'react'
import { statuses } from '../../utils/constants'
import { errorText } from '../../utils/errors'
import { Alert, Field } from '../common/UI'

export function ProjectForm({ project, api, close, saved }) {
  const isNew = !project.id
  const [form, setForm] = useState({
    name: project.name || '',
    address: project.address || '',
    useCase: project.useCase || '',
    status: project.status || 'DRAFT',
  })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api(isNew ? '/api/projects' : `/api/projects/${project.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        body: JSON.stringify(form),
      })
      saved()
    } catch (err) {
      setError(errorText(err))
    }
  }

  return (
    <form className="editor" onSubmit={submit}>
      <div>
        <h2>{isNew ? 'New project' : 'Edit project'}</h2>
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="fields">
        <Field label="Name" value={form.name} setValue={(name) => setForm({ ...form, name })} />
        <Field
          label="Address"
          value={form.address}
          setValue={(address) => setForm({ ...form, address })}
        />
        <Field
          label="Use case"
          value={form.useCase}
          setValue={(useCase) => setForm({ ...form, useCase })}
        />
        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {statuses.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <button className="primary">Save project</button>
    </form>
  )
}
