import { NextRequest, NextResponse } from "next/server"
import { isMockEnabled } from "@/lib/feature-flags"
import { getMockGithubResponse } from "@/lib/mocks/github-results"

export async function POST(req: NextRequest) {
  try {
    const { action, query, owner, repo, path } = await req.json()

    // Mock guard
    if (isMockEnabled('github')) {
      return NextResponse.json(getMockGithubResponse(action))
    }

    const { searchCode, searchRepos, getContents } = await import("@/lib/github")

    switch (action) {
      case "searchCode": {
        if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 })
        const result = await searchCode(query)
        return NextResponse.json({ success: true, ...result })
      }
      case "searchRepos": {
        if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 })
        const result = await searchRepos(query)
        return NextResponse.json({ success: true, ...result })
      }
      case "getContents": {
        if (!owner || !repo || !path) {
          return NextResponse.json({ error: "owner, repo, and path required" }, { status: 400 })
        }
        const result = await getContents(owner, repo, path)
        return NextResponse.json({ success: true, data: result })
      }
      default:
        return NextResponse.json({ error: "Invalid action. Use: searchCode, searchRepos, getContents" }, { status: 400 })
    }
  } catch (error) {
    // Fallback to mock on error
    try {
      const body = await req.clone().json().catch(() => ({ action: 'searchRepos' }))
      return NextResponse.json(getMockGithubResponse(body.action || 'searchRepos'))
    } catch {
      const message = error instanceof Error ? error.message : "GitHub API failed"
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
  }
}
