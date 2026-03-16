import { NextRequest, NextResponse } from 'next/server'
import { isMockEnabled } from '@/lib/feature-flags'
import { getMockGraphResponse } from '@/lib/mocks/graph-data'

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json()

    // Mock guard
    if (isMockEnabled('graph')) {
      return NextResponse.json(getMockGraphResponse(action, params))
    }

    const {
      verifyConnection,
      getDocumentGraph,
      getGraphStats,
      searchDocuments,
      indexDocument,
      linkDocuments,
    } = await import('@/lib/neo4j')

    switch (action) {
      case 'health': {
        const result = await verifyConnection()
        return NextResponse.json({ success: true, ...result })
      }
      case 'graph': {
        const data = await getDocumentGraph()
        return NextResponse.json({ success: true, data })
      }
      case 'stats': {
        const stats = await getGraphStats()
        return NextResponse.json({ success: true, stats: stats[0] || {} })
      }
      case 'search': {
        if (!params.query) return NextResponse.json({ error: 'Query required' }, { status: 400 })
        const results = await searchDocuments(params.query)
        return NextResponse.json({ success: true, results })
      }
      case 'index': {
        if (!params.document) return NextResponse.json({ error: 'Document required' }, { status: 400 })
        const result = await indexDocument(params.document)
        return NextResponse.json({ success: true, result })
      }
      case 'link': {
        if (!params.fromId || !params.toId) {
          return NextResponse.json({ error: 'fromId and toId required' }, { status: 400 })
        }
        const result = await linkDocuments(params.fromId, params.toId, params.relationship || 'RELATED_TO')
        return NextResponse.json({ success: true, result })
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    // Fallback to mock on error
    try {
      const body = await req.clone().json().catch(() => ({ action: 'health' }))
      return NextResponse.json(getMockGraphResponse(body.action || 'health', body))
    } catch {
      const message = error instanceof Error ? error.message : 'Graph operation failed'
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
  }
}
