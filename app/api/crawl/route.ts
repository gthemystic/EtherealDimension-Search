import { NextRequest, NextResponse } from "next/server"
import { isMockEnabled } from "@/lib/feature-flags"
import { getMockCrawlResponse } from "@/lib/mocks/process-results"

export async function POST(req: NextRequest) {
  try {
    const { url, query } = await req.json()

    // Mock guard
    if (isMockEnabled('crawl')) {
      return NextResponse.json(getMockCrawlResponse(url, query))
    }

    const { scrapeUrl, searchAndScrape } = await import("@/lib/firecrawl")

    if (url) {
      const result = await scrapeUrl(url)
      return NextResponse.json({ success: true, ...result })
    }

    if (query) {
      const result = await searchAndScrape(query)
      return NextResponse.json({ success: true, ...result })
    }

    return NextResponse.json({ error: "URL or query required" }, { status: 400 })
  } catch (error) {
    // Fallback to mock on error
    try {
      const body = await req.clone().json().catch(() => ({}))
      return NextResponse.json(getMockCrawlResponse(body.url, body.query))
    } catch {
      const message = error instanceof Error ? error.message : "Crawl failed"
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
  }
}
