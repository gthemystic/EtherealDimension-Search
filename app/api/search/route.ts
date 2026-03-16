import { NextRequest } from "next/server"
import { detectContext } from "@/lib/engineering-context"
import { isMockEnabled } from "@/lib/feature-flags"
import { createMockSearchStream } from "@/lib/mocks/search-results"

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query) return new Response(JSON.stringify({ error: "Query required" }), { status: 400 })

    // Mock guard
    if (isMockEnabled('search')) {
      return new Response(createMockSearchStream(query), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    const key = process.env.PERPLEXITY_API_KEY
    if (!key) return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY not set" }), { status: 500 })

    const context = detectContext(query)

    const res = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: context || "You are an expert engineering document search assistant. Provide detailed, technical answers about structural engineering, MEP coordination, building codes (IBC, ASCE 7), geotechnical engineering, and construction. Always cite sources when possible. Format your response with markdown for clarity." },
          { role: "user", content: query },
        ],
        max_tokens: 4096,
        temperature: 0.2,
        return_citations: true,
        stream: true,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      return new Response(JSON.stringify({ error: `Perplexity API error: ${res.status} - ${error}` }), { status: 500 })
    }

    // Stream SSE to client
    const encoder = new TextEncoder()
    let citations: string[] = []
    let fullAnswer = ""

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue
              const data = line.slice(6).trim()
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content || ""
                if (delta) {
                  fullAnswer += delta
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`)
                  )
                }
                // Capture citations from the response
                if (parsed.citations) {
                  citations = parsed.citations
                }
              } catch {
                // skip malformed JSON
              }
            }
          }

          // Send final message with metadata
          const confidence = Math.min(0.95, 0.75 + (citations.length * 0.03))
          const sources = citations.map((c: string, i: number) => ({
            type: "external" as const,
            label: c.length > 50 ? c.slice(0, 50) + "..." : c || `Source ${i + 1}`,
            url: c,
          }))

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                answer: fullAnswer,
                confidence,
                sources: sources.length > 0 ? sources : [{ type: "external", label: "Perplexity sonar-pro", url: "" }],
                citations,
              })}\n\n`
            )
          )
          controller.close()
        } catch (err) {
          // On error, fall back to mock
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    // Fallback to mock on any error
    try {
      const body = await req.clone().json().catch(() => ({ query: '' }))
      return new Response(createMockSearchStream(body.query || ''), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } catch {
      const message = error instanceof Error ? error.message : "Search failed"
      return new Response(JSON.stringify({ success: false, error: message }), { status: 500 })
    }
  }
}
