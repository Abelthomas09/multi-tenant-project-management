export const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem('pm_session'))
  } catch {
    return null
  }
}
