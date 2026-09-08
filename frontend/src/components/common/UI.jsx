export function Field({ label, value, setValue, type = 'text' }) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete={type === 'email' ? 'email' : type === 'password' ? 'current-password' : 'on'}
        required
      />
    </label>
  )
}

export function Alert({ children }) {
  return <div className="alert">{children}</div>
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>
}

export function Nav({ active, children, onClick }) {
  return (
    <button className={active ? 'active' : ''} onClick={onClick}>
      {children}
    </button>
  )
}
