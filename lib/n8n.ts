/**
 * n8n Multi-Agent Orchestration
 * Calls n8n webhooks for multi-agent search workflows
 */

const N8N_BASE = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'

export interface N8nSearchResult {
  answer: string
  sources: { title: string; url: string; relevance: number }[]
  agents: { name: string; status: string; durationMs: number }[]
  confidence: number
  metadata?: Record<string, unknown>
}

export async function triggerMultiAgentSearch(query: string, context?: string): Promise<N8nSearchResult> {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      throw new Error(`n8n webhook returned ${res.status}`)
    }

    return await res.json()
  } catch {
    // n8n not available - return null to fall back to direct API
    return null as unknown as N8nSearchResult
  }
}

export async function triggerDocumentPipeline(doc: {
  id: string
  name: string
  content: string
  chunks: number
}): Promise<{ success: boolean; graphNodes?: number; error?: string }> {
  try {
    const res = await fetch(`${N8N_BASE}/webhook/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) throw new Error(`n8n ingest webhook returned ${res.status}`)
    return await res.json()
  } catch {
    return { success: false, error: 'n8n not available' }
  }
}

export async function checkN8nHealth(): Promise<{ available: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    const res = await fetch(`${N8N_BASE}/healthz`, {
      signal: AbortSignal.timeout(3000),
    })
    return { available: res.ok, latencyMs: Date.now() - start }
  } catch {
    return { available: false, latencyMs: Date.now() - start }
  }
}
