export const STORAGE_KEYS = {
  SEARCH_HISTORY: 'ethd:searchHistory',
  CHAT_HISTORY: 'ethd:chatHistory',
  LIBRARY: 'ethd:library',
  ACTIVITY: 'ethd:activity',
  CONNECTION_STATUS: 'ethd:connectionStatus',
  MODEL_CONFIG: 'ethd:modelConfig',
} as const

export function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable
  }
}

export function removeItem(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}
