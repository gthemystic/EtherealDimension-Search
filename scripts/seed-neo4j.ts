/**
 * Seed Neo4j with sample engineering document graph data
 * Run: npx tsx scripts/seed-neo4j.ts
 */

import neo4j from 'neo4j-driver'

const URI = process.env.NEO4J_URI || 'bolt://localhost:7687'
const USER = process.env.NEO4J_USER || 'neo4j'
const PASS = process.env.NEO4J_PASSWORD || 'etherealdimension'

async function seed() {
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS))
  const session = driver.session()

  console.log('🔌 Connecting to Neo4j...')

  try {
    // Clear existing data
    await session.run('MATCH (n) DETACH DELETE n')
    console.log('🧹 Cleared existing data')

    // Create Documents
    const docs = [
      { id: 'doc-1', name: 'ASTM-A992-Structural-Steel-Spec.pdf', type: 'PDF', summary: 'Standard specification for structural steel shapes. Covers chemical and mechanical requirements for W, HP, and S shapes.' },
      { id: 'doc-2', name: 'Bridge-Load-Analysis-2026.pdf', type: 'PDF', summary: 'Comprehensive load analysis for a 4-span continuous bridge. Includes dead load, live load (HL-93), and seismic combinations.' },
      { id: 'doc-3', name: 'MEP-Coordination-Drawings-Tower-A.pdf', type: 'PDF', summary: 'MEP coordination drawings for a 32-story residential tower. Covers HVAC, electrical, plumbing, and fire protection systems.' },
      { id: 'doc-4', name: 'Foundation-Geotechnical-Report.pdf', type: 'PDF', summary: 'Geotechnical investigation report with boring logs, SPT data, and foundation recommendations for expansive clay soils.' },
      { id: 'doc-5', name: 'Steel-Connection-Details-R3.pdf', type: 'PDF', summary: 'Structural steel connection details including moment connections, shear tabs, and base plates per AISC 360.' },
      { id: 'doc-6', name: 'IBC-2024-Austin-Amendments.pdf', type: 'PDF', summary: 'City of Austin local amendments to the 2024 International Building Code, covering fire-rated assemblies and accessibility.' },
      { id: 'doc-7', name: 'Seismic-Design-ASCE-7-22.pdf', type: 'PDF', summary: 'Seismic design criteria per ASCE 7-22 for a medical center in Seismic Design Category D.' },
      { id: 'doc-8', name: 'Concrete-Mix-Design-4000PSI.pdf', type: 'PDF', summary: 'Concrete mix design report for 4000 psi structural concrete with fly ash replacement and admixture dosage.' },
    ]

    for (const doc of docs) {
      await session.run(
        `CREATE (d:Document {id: $id, name: $name, type: $type, summary: $summary, uploadedAt: datetime()})`,
        doc
      )
    }
    console.log(`📄 Created ${docs.length} documents`)

    // Create Entities (codes, materials, elements)
    const entities = [
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

    for (const ent of entities) {
      await session.run(
        `CREATE (e:Entity {id: $id, name: $name, type: $type})`,
        ent
      )
    }
    console.log(`🏷️  Created ${entities.length} entities`)

    // Create relationships: Document -> MENTIONS -> Entity
    const mentions = [
      ['doc-1', 'ent-5'], ['doc-1', 'ent-1'], ['doc-1', 'ent-6'],
      ['doc-2', 'ent-8'], ['doc-2', 'ent-2'], ['doc-2', 'ent-7'],
      ['doc-3', 'ent-3'],
      ['doc-4', 'ent-12'], ['doc-4', 'ent-13'],
      ['doc-5', 'ent-1'], ['doc-5', 'ent-10'], ['doc-5', 'ent-11'], ['doc-5', 'ent-6'], ['doc-5', 'ent-7'],
      ['doc-6', 'ent-3'],
      ['doc-7', 'ent-2'], ['doc-7', 'ent-14'], ['doc-7', 'ent-3'],
      ['doc-8', 'ent-4'], ['doc-8', 'ent-9'],
    ]

    for (const [docId, entId] of mentions) {
      await session.run(
        `MATCH (d:Document {id: $docId}), (e:Entity {id: $entId}) CREATE (d)-[:MENTIONS]->(e)`,
        { docId, entId }
      )
    }
    console.log(`🔗 Created ${mentions.length} MENTIONS relationships`)

    // Create cross-document relationships
    const related = [
      ['doc-1', 'doc-5', 'REFERENCES'],   // Steel spec referenced by connections
      ['doc-5', 'doc-2', 'APPLIED_IN'],    // Connections applied in bridge
      ['doc-7', 'doc-6', 'SUPERSEDED_BY'], // Seismic design references IBC
      ['doc-4', 'doc-2', 'SUPPORTS'],      // Geotech supports bridge design
      ['doc-8', 'doc-4', 'SPECIFIED_IN'],  // Concrete mix specified in geotech
      ['doc-3', 'doc-6', 'COMPLIES_WITH'], // MEP complies with IBC
    ]

    for (const [from, to, rel] of related) {
      await session.run(
        `MATCH (a:Document {id: $from}), (b:Document {id: $to}) CREATE (a)-[:RELATED_TO {type: $rel}]->(b)`,
        { from, to, rel }
      )
    }
    console.log(`📊 Created ${related.length} document relationships`)

    // Create Chunks for first doc as example
    const chunks = [
      'ASTM A992/A992M covers structural steel shapes (W, HP, and S) for use in building framing and general structural purposes.',
      'Chemical composition: Carbon 0.23% max, Manganese 1.35% max, Phosphorus 0.035% max, Sulfur 0.045% max.',
      'Mechanical properties: Minimum yield strength 50 ksi (345 MPa), minimum tensile strength 65 ksi (450 MPa).',
      'Supplementary requirements may be specified for Charpy V-notch impact testing at temperatures below room temperature.',
    ]

    for (let i = 0; i < chunks.length; i++) {
      await session.run(
        `MATCH (d:Document {id: 'doc-1'})
         CREATE (c:Chunk {id: $chunkId, content: $content, index: $index, tokens: $tokens})
         CREATE (d)-[:HAS_CHUNK]->(c)`,
        { chunkId: `chunk-1-${i}`, content: chunks[i], index: i, tokens: Math.ceil(chunks[i].length / 4) }
      )
    }
    console.log(`📝 Created ${chunks.length} chunks for doc-1`)

    // Final stats
    const stats = await session.run(
      `MATCH (d:Document) WITH count(d) AS docs
       MATCH (e:Entity) WITH docs, count(e) AS entities
       MATCH (c:Chunk) WITH docs, entities, count(c) AS chunks
       MATCH ()-[r]->() WITH docs, entities, chunks, count(r) AS rels
       RETURN docs, entities, chunks, rels`
    )

    const s = stats.records[0]
    console.log('\n✅ Seed complete!')
    console.log(`   Documents: ${s.get('docs')}`)
    console.log(`   Entities:  ${s.get('entities')}`)
    console.log(`   Chunks:    ${s.get('chunks')}`)
    console.log(`   Relations: ${s.get('rels')}`)

  } catch (err) {
    console.error('❌ Error:', err)
  } finally {
    await session.close()
    await driver.close()
  }
}

seed()
