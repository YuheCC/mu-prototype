const STORAGE_KEY = 'mu.assets.dismissedTaskIds'

export function loadDismissedTaskIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

export function saveDismissedTaskIds(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}
