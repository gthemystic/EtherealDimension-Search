import { NextRequest, NextResponse } from "next/server"
import { isMockEnabled } from "@/lib/feature-flags"
import { getMockChatResponse } from "@/lib/mocks/chat-responses"

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 })
    }

    // Mock guard
    if (isMockEnabled('chat')) {
      const mock = getMockChatResponse(messages)
      return NextResponse.json({ success: true, ...mock })
    }

    const { chat } = await import("@/lib/groq")
    const result = await chat(messages, model)

    return NextResponse.json({
      success: true,
      response: result.response,
      model: result.model,
      usage: result.usage,
    })
  } catch (error) {
    // Fallback to mock on error
    try {
      const body = await req.clone().json().catch(() => ({ messages: [] }))
      const mock = getMockChatResponse(body.messages || [])
      return NextResponse.json({ success: true, ...mock })
    } catch {
      const message = error instanceof Error ? error.message : "Chat failed"
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
  }
}
