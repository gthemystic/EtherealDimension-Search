const DOCUMENTS = [
  { id: 'doc-1', name: 'ASTM-A992-Structural-Steel-Spec.pdf', type: 'PDF', summary: 'Standard specification for structural steel shapes. Covers chemical and mechanical requirements for W, HP, and S shapes.' },
  { id: 'doc-2', name: 'Bridge-Load-Analysis-2026.pdf', type: 'PDF', summary: 'Comprehensive load analysis for a 4-span continuous bridge. Includes dead load, live load (HL-93), and seismic combinations.' },
  { id: 'doc-3', name: 'MEP-Coordination-Drawings-Tower-A.pdf', type: 'PDF', summary: 'MEP coordination drawings for a 32-story residential tower. Covers HVAC, electrical, plumbing, and fire protection systems.' },
  { id: 'doc-4', name: 'Foundation-Geotechnical-Report.pdf', type: 'PDF', summary: 'Geotechnical investigation report with boring logs, SPT data, and foundation recommendations for expansive clay soils.' },
  { id: 'doc-5', name: 'Steel-Connection-Details-R3.pdf', type: 'PDF', summary: 'Structural steel connection details including moment connections, shear tabs, and base plates per AISC 360.' },
  { id: 'doc-6', name: 'IBC-2024-Austin-Amendments.pdf', type: 'PDF', summary: 'City of Austin local amendments to the 2024 IBC, covering fire-rated assemblies and accessibility.' },
  { id: 'doc-7', name: 'Seismic-Design-ASCE-7-22.pdf', type: 'PDF', summary: 'Seismic design criteria per ASCE 7-22 for a medical center in SDC D.' },
  { id: 'doc-8', name: 'Concrete-Mix-Design-4000PSI.pdf', type: 'PDF', summary: 'Concrete mix design for 4000 psi with fly ash replacement and admixture dosage.' },
]

const ENTITIES = [
  { id: 'ent-1', name: 'AISC 360', type: 'code' },
  { id: 'ent-2', name: 'ASCE 7-22', type: 'code' },
  { id: 'ent-3', name: 'IBC 2024', type: 'code' },
  { id: 'ent-4', name: 'ACI 318', type: 'code' },
  { id: 'ent-5', name: 'ASTM A992', type: 'material' },
  { id: 'ent-6', name: 'W18x55', type: 'steel_section' },
  { id: 'ent-7', name: 'W24x76', type: 'steel_section' },
  { id: 'ent-8', name: 'HL-93', type: 'load_type' },
  { id: 'ent-9', name: '4000 psi', type: 'strength' },
  { id: 'ent-10', name: 'Moment Connection', type: 'structural_element' },
  { id: 'ent-11', name: 'Shear Tab', type: 'structural_element' },
  { id: 'ent-12', name: 'Drilled Pier', type: 'foundation_type' },
  { id: 'ent-13', name: 'Expansive Clay', type: 'soil_type' },
  { id: 'ent-14', name: 'SDC D', type: 'seismic_category' },
]

const RELATIONSHIPS = [
  { from: 'doc-1', to: 'ent-5', type: 'MENTIONS' },
  { from: 'doc-1', to: 'ent-1', type: 'MENTIONS' },
  { from: 'doc-1', to: 'ent-6', type: 'MENTIONS' },
  { from: 'doc-2', to: 'ent-8', type: 'MENTIONS' },
  { from: 'doc-2', to: 'ent-2', type: 'MENTIONS' },
  { from: 'doc-2', to: 'ent-7', type: 'MENTIONS' },
  { from: 'doc-3', to: 'ent-3', type: 'MENTIONS' },
  { from: 'doc-4', to: 'ent-12', type: 'MENTIONS' },
  { from: 'doc-4', to: 'ent-13', type: 'MENTIONS' },
  { from: 'doc-5', to: 'ent-1', type: 'MENTIONS' },
  { from: 'doc-5', to: 'ent-10', type: 'MENTIONS' },
  { from: 'doc-5', to: 'ent-11', type: 'MENTIONS' },
  { from: 'doc-5', to: 'ent-6', type: 'MENTIONS' },
  { from: 'doc-5', to: 'ent-7', type: 'MENTIONS' },
  { from: 'doc-6', to: 'ent-3', type: 'MENTIONS' },
  { from: 'doc-7', to: 'ent-2', type: 'MENTIONS' },
  { from: 'doc-7', to: 'ent-14', type: 'MENTIONS' },
  { from: 'doc-7', to: 'ent-3', type: 'MENTIONS' },
  { from: 'doc-8', to: 'ent-4', type: 'MENTIONS' },
  { from: 'doc-8', to: 'ent-9', type: 'MENTIONS' },
  { from: 'doc-1', to: 'doc-5', type: 'REFERENCES' },
  { from: 'doc-5', to: 'doc-2', type: 'APPLIED_IN' },
  { from: 'doc-7', to: 'doc-6', type: 'SUPERSEDED_BY' },
  { from: 'doc-4', to: 'doc-2', type: 'SUPPORTS' },
  { from: 'doc-8', to: 'doc-4', type: 'SPECIFIED_IN' },
  { from: 'doc-3', to: 'doc-6', type: 'COMPLIES_WITH' },
]

export function getMockGraphResponse(action: string, params?: { query?: string }): object {
  switch (action) {
    case 'health':
      return { success: true, connected: true, latencyMs: 12 }

    case 'stats':
      return { success: true, stats: { docs: 8, chunks: 4, entities: 14, relationships: 26 } }

    case 'graph':
      return {
        success: true,
        data: {
          documents: DOCUMENTS,
          entities: ENTITIES,
          relationships: RELATIONSHIPS,
        },
      }

    case 'search': {
      const q = (params?.query || '').toLowerCase()
      const results = DOCUMENTS.filter(
        (d) => d.name.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q)
      )
      return { success: true, results }
    }

    default:
      return { success: true, result: { acknowledged: true } }
  }
}
