import { getItem, setItem, STORAGE_KEYS } from '@/lib/local-storage'
import type { ActivityEvent } from '@/lib/activity-tracker'

function daysAgo(n: number, hour: number, minute: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const DEMO_EVENTS: ActivityEvent[] = [
  // Day -6
  { id: 'demo-0', type: 'search', title: 'ASCE 7-22 wind speed requirements Austin TX', timestamp: daysAgo(6, 9, 15) },
  { id: 'demo-1', type: 'search', title: 'ASTM A992 Grade 50 mechanical properties', timestamp: daysAgo(6, 10, 42) },
  { id: 'demo-2', type: 'upload', title: 'ASTM-A992-Structural-Steel-Spec.pdf', timestamp: daysAgo(6, 11, 8) },

  // Day -5
  { id: 'demo-3', type: 'search', title: 'W18x55 beam LRFD flexural capacity', timestamp: daysAgo(5, 8, 30) },
  { id: 'demo-4', type: 'chat', title: 'W24x76 deflection check L/360 live load', timestamp: daysAgo(5, 14, 22) },
  { id: 'demo-5', type: 'upload', title: 'Bridge-Load-Analysis-2026.pdf', timestamp: daysAgo(5, 16, 5) },

  // Day -4
  { id: 'demo-6', type: 'search', title: 'IBC 2024 Table 601 fire-resistance ratings', timestamp: daysAgo(4, 9, 55) },
  { id: 'demo-7', type: 'upload', title: 'MEP-Coordination-Drawings-Tower-A.pdf', timestamp: daysAgo(4, 11, 30) },
  { id: 'demo-8', type: 'chat', title: 'Drilled piers vs spread footings in expansive clay', timestamp: daysAgo(4, 15, 10) },

  // Day -3
  { id: 'demo-9', type: 'search', title: 'HL-93 live load distribution factors', timestamp: daysAgo(3, 10, 0) },
  { id: 'demo-10', type: 'search', title: 'Seismic Design Category D requirements ASCE 7-22', timestamp: daysAgo(3, 13, 45) },
  { id: 'demo-11', type: 'upload', title: 'Foundation-Geotechnical-Report.pdf', timestamp: daysAgo(3, 15, 20) },

  // Day -2
  { id: 'demo-12', type: 'chat', title: 'Shear tab connection design single plate 3 bolts', timestamp: daysAgo(2, 9, 10) },
  { id: 'demo-13', type: 'search', title: 'Moment connection WUF-W prequalified AISC 358', timestamp: daysAgo(2, 11, 35) },
  { id: 'demo-14', type: 'upload', title: 'Steel-Connection-Details-R3.pdf', timestamp: daysAgo(2, 14, 50) },

  // Day -1
  { id: 'demo-15', type: 'search', title: 'ACI 318-19 shear wall design provisions', timestamp: daysAgo(1, 10, 20) },
  { id: 'demo-16', type: 'upload', title: 'Seismic-Design-ASCE-7-22.pdf', timestamp: daysAgo(1, 13, 15) },

  // Today
  { id: 'demo-17', type: 'search', title: 'HVAC duct sizing CFM calculations high-rise', timestamp: daysAgo(0, 8, 45) },
]

export function seedDemoData(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem('ethd:demoSeeded')) return

  const existing = getItem<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY, [])
  if (existing.length > 0) {
    localStorage.setItem('ethd:demoSeeded', 'true')
    return
  }

  setItem(STORAGE_KEYS.ACTIVITY, DEMO_EVENTS)
  localStorage.setItem('ethd:demoSeeded', 'true')
}
