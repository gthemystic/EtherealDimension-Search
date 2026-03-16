import { getItem, setItem, STORAGE_KEYS } from '@/lib/local-storage'

export interface LibraryDocument {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  status: 'indexed' | 'processing' | 'stale'
  summary: string
  chunks: number
  pages: number
  urlsEnriched: number
  visionAnalyses: number
}

function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const MOCK_DOCUMENTS: LibraryDocument[] = [
  {
    id: 'doc-astm-a992',
    name: 'ASTM-A992-Structural-Steel-Spec.pdf',
    size: 2_516_582,
    type: 'application/pdf',
    uploadedAt: daysAgoISO(6),
    status: 'indexed',
    summary: 'Standard specification for structural steel shapes (W, HP, S). Covers chemical composition (C\u22640.23%, Mn\u22641.35%), mechanical properties (Fy=50 ksi, Fu=65 ksi), and supplementary Charpy V-notch requirements per ASTM A6.',
    chunks: 4,
    pages: 12,
    urlsEnriched: 2,
    visionAnalyses: 1,
  },
  {
    id: 'doc-bridge-load',
    name: 'Bridge-Load-Analysis-2026.pdf',
    size: 9_332_736,
    type: 'application/pdf',
    uploadedAt: daysAgoISO(5),
    status: 'indexed',
    summary: 'Comprehensive load analysis for a 4-span continuous bridge (80-100-100-80 ft). Includes HL-93 live load, dead load (DC/DW), temperature gradient (TG), and ASCE 7-22 seismic combinations. Governs: Strength I with HL-93 tandem + lane.',
    chunks: 12,
    pages: 47,
    urlsEnriched: 5,
    visionAnalyses: 8,
  },
  {
    id: 'doc-mep-coord',
    name: 'MEP-Coordination-Drawings-Tower-A.pdf',
    size: 16_041_164,
    type: 'application/pdf',
    uploadedAt: daysAgoISO(4),
    status: 'indexed',
    summary: 'MEP coordination set for a 32-story residential tower (Austin, TX). 47 clash detections resolved across HVAC, plumbing, electrical, and fire protection. BIM Level 350 LOD. Revit 2024 export.',
    chunks: 8,
    pages: 64,
    urlsEnriched: 3,
    visionAnalyses: 15,
  },
  {
    id: 'doc-foundation',
    name: 'Foundation-Geotechnical-Report.pdf',
    size: 4_404_019,
    type: 'application/pdf',
    uploadedAt: daysAgoISO(3),
    status: 'indexed',
    summary: 'Geotechnical investigation \u2014 Austin, TX. 12 borings to 50 ft. High-plasticity clay (CH), PI=45. Drilled piers to Austin Chalk recommended. Allowable bearing: 3,000 psf. Void box forms required for grade beams.',
    chunks: 6,
    pages: 28,
    urlsEnriched: 2,
    visionAnalyses: 4,
  },
  {
    id: 'doc-steel-conn',
    name: 'Steel-Connection-Details-R3.pdf',
    size: 3_460_300,
    type: 'application/pdf',
    uploadedAt: daysAgoISO(2),
    status: 'indexed',
    summary: 'Structural steel connection details by Thornton Engineering. Includes moment connections (WUF-W), shear tabs (3/8" A36 plate), base plates (1.5" A36), and column splices. All per AISC 360-22 and AISC 358-22.',
    chunks: 5,
    pages: 18,
    urlsEnriched: 3,
    visionAnalyses: 6,
  },
  {
    id: 'doc-seismic',
    name: 'Seismic-Design-ASCE-7-22.pdf',
    size: 5_452_595,
    type: 'application/pdf',
    uploadedAt: daysAgoISO(1),
    status: 'indexed',
    summary: 'Seismic design criteria \u2014 Pacific Structural Group. SDC D, Ss=1.2g, S1=0.5g. Special moment frame (R=8, Cd=5.5, \u03A90=3). Equivalent lateral force + modal response spectrum analysis. Base shear V=0.044W governs.',
    chunks: 9,
    pages: 34,
    urlsEnriched: 4,
    visionAnalyses: 7,
  },
]

export function seedLibraryData(): void {
  const existing = getItem<LibraryDocument[]>(STORAGE_KEYS.LIBRARY, [])
  if (existing.length > 0) return
  setItem(STORAGE_KEYS.LIBRARY, MOCK_DOCUMENTS)
}
