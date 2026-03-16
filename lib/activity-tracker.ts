import { getItem, setItem, STORAGE_KEYS } from '@/lib/local-storage'

export type ActivityType = 'search' | 'upload' | 'chat'

export interface ActivityEvent {
  id: string
  type: ActivityType
  title: string
  timestamp: string
  meta?: Record<string, string>
}

export interface ActivityStats {
  totalSearches: number
  totalUploads: number
  totalChats: number
  recentSearches: ActivityEvent[]
  recentUploads: ActivityEvent[]
  recentChats: ActivityEvent[]
}

export interface DailyActivity {
  day: string
  date: string
  Searches: number
  Uploads: number
  Chats: number
}

const MAX_EVENTS = 200

function addEvent(event: ActivityEvent) {
  const events = getItem<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY, [])
  events.push(event)
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS)
  setItem(STORAGE_KEYS.ACTIVITY, events)
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function trackSearch(query: string) {
  addEvent({
    id: makeId(),
    type: 'search',
    title: query,
    timestamp: new Date().toISOString(),
  })
}

export function trackUpload(fileName: string) {
  addEvent({
    id: makeId(),
    type: 'upload',
    title: fileName,
    timestamp: new Date().toISOString(),
  })
}

export function trackChat(title: string) {
  addEvent({
    id: makeId(),
    type: 'chat',
    title,
    timestamp: new Date().toISOString(),
  })
}

export function getStats(): ActivityStats {
  const events = getItem<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY, [])
  const searches = events.filter((e) => e.type === 'search')
  const uploads = events.filter((e) => e.type === 'upload')
  const chats = events.filter((e) => e.type === 'chat')

  return {
    totalSearches: searches.length,
    totalUploads: uploads.length,
    totalChats: chats.length,
    recentSearches: searches.slice(-10).reverse(),
    recentUploads: uploads.slice(-10).reverse(),
    recentChats: chats.slice(-10).reverse(),
  }
}

export function getDailyActivity(days: number): DailyActivity[] {
  const events = getItem<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY, [])
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const result: DailyActivity[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayEvents = events.filter((e) => e.timestamp.startsWith(dateStr))

    result.push({
      day: dayNames[d.getDay()],
      date: dateStr,
      Searches: dayEvents.filter((e) => e.type === 'search').length,
      Uploads: dayEvents.filter((e) => e.type === 'upload').length,
      Chats: dayEvents.filter((e) => e.type === 'chat').length,
    })
  }

  return result
}

export function getAllEvents(): ActivityEvent[] {
  return getItem<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY, [])
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}
