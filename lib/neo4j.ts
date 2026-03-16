import neo4j, { Driver, Session } from 'neo4j-driver'

let driver: Driver | null = null

function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687'
    const user = process.env.NEO4J_USER || 'neo4j'
    const password = process.env.NEO4J_PASSWORD || 'etherealdimension'
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  }
  return driver
}

export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session: Session = getDriver().session()
  try {
    const result = await session.run(cypher, params)
    return result.records.map((record) => {
      const obj: Record<string, unknown> = {}
      record.keys.forEach((key) => {
        obj[key as string] = record.get(key)
      })
      return obj as T
    })
  } finally {
    await session.close()
  }
}

export async function verifyConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const start = Date.now()
  try {
    const session = getDriver().session()
    await session.run('RETURN 1 AS ok')
    await session.close()
    return { connected: true, latencyMs: Date.now() - start }
  } catch (err) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

// --- Document Graph Operations ---

export async function indexDocument(doc: {
  id: string
  name: string
  type: string
  size: number
  summary?: string
  chunks?: number
  uploadedAt: string
}) {
  return runQuery(
    `MERGE (d:Document {id: $id})
     SET d.name = $name, d.type = $type, d.size = $size,
         d.summary = $summary, d.chunks = $chunks,
         d.uploadedAt = $uploadedAt
     RETURN d`,
    doc
  )
}

export async function addDocumentChunk(docId: string, chunk: {
  id: string
  content: string
  index: number
  tokens: number
}) {
  return runQuery(
    `MATCH (d:Document {id: $docId})
     MERGE (c:Chunk {id: $chunkId})
     SET c.content = $content, c.index = $index, c.tokens = $tokens
     MERGE (d)-[:HAS_CHUNK]->(c)
     RETURN c`,
    { docId, chunkId: chunk.id, content: chunk.content, index: chunk.index, tokens: chunk.tokens }
  )
}

export async function linkDocuments(fromId: string, toId: string, relationship: string) {
  return runQuery(
    `MATCH (a:Document {id: $fromId}), (b:Document {id: $toId})
     MERGE (a)-[r:RELATED_TO {type: $relationship}]->(b)
     RETURN a, r, b`,
    { fromId, toId, relationship }
  )
}

export async function addEntity(entity: { id: string; name: string; type: string; docId: string }) {
  return runQuery(
    `MATCH (d:Document {id: $docId})
     MERGE (e:Entity {id: $entityId, type: $type})
     SET e.name = $name
     MERGE (d)-[:MENTIONS]->(e)
     RETURN e`,
    { docId: entity.docId, entityId: entity.id, name: entity.name, type: entity.type }
  )
}

export async function getDocumentGraph() {
  return runQuery(
    `MATCH (d:Document)
     OPTIONAL MATCH (d)-[r]->(related)
     RETURN d, type(r) AS relType, related
     LIMIT 500`
  )
}

export async function searchDocuments(query: string) {
  return runQuery(
    `MATCH (d:Document)
     WHERE toLower(d.name) CONTAINS toLower($query)
        OR toLower(d.summary) CONTAINS toLower($query)
     RETURN d
     ORDER BY d.uploadedAt DESC
     LIMIT 20`,
    { query }
  )
}

export async function getGraphStats() {
  return runQuery(
    `MATCH (d:Document) WITH count(d) AS docs
     OPTIONAL MATCH (c:Chunk) WITH docs, count(c) AS chunks
     OPTIONAL MATCH (e:Entity) WITH docs, chunks, count(e) AS entities
     OPTIONAL MATCH ()-[r]->() WITH docs, chunks, entities, count(r) AS relationships
     RETURN docs, chunks, entities, relationships`
  )
}

export async function closeDriver() {
  if (driver) {
    await driver.close()
    driver = null
  }
}
