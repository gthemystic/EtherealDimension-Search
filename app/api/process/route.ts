import { NextRequest, NextResponse } from "next/server"
import { isMockEnabled } from "@/lib/feature-flags"
import { getMockProcessResponse } from "@/lib/mocks/process-results"

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm", ".log", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf", ".env", ".sh", ".ts", ".js", ".jsx", ".tsx", ".py", ".rb", ".go", ".rs", ".java", ".c", ".cpp", ".h", ".css", ".scss", ".sql"])

function getFileExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot >= 0 ? name.slice(dot).toLowerCase() : ""
}

function isTextFile(name: string, mimeType: string): boolean {
  if (TEXT_EXTENSIONS.has(getFileExtension(name))) return true
  if (mimeType.startsWith("text/")) return true
  if (mimeType === "application/json" || mimeType === "application/xml") return true
  return false
}

function isPdf(name: string, mimeType: string): boolean {
  return getFileExtension(name) === ".pdf" || mimeType === "application/pdf"
}

function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let raw = ""
  for (let i = 0; i < bytes.length; i++) {
    raw += String.fromCharCode(bytes[i])
  }

  const chunks: string[] = []
  const btEtRegex = /BT\s([\s\S]*?)ET/g
  let match: RegExpExecArray | null
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1]
    const stringRegex = /\(([^)]*)\)/g
    let strMatch: RegExpExecArray | null
    while ((strMatch = stringRegex.exec(block)) !== null) {
      const decoded = strMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
      chunks.push(decoded)
    }
  }

  const text = chunks
    .join(" ")
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return text
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File required" }, { status: 400 })
    }

    // Mock guard
    if (isMockEnabled('process')) {
      return NextResponse.json(getMockProcessResponse(file.name, file.size))
    }

    let extractedText = ""
    let fileCategory: "pdf" | "text" | "binary" = "binary"

    if (isPdf(file.name, file.type)) {
      fileCategory = "pdf"
      const buffer = await file.arrayBuffer()
      extractedText = extractTextFromPdfBuffer(buffer)
    } else if (isTextFile(file.name, file.type)) {
      fileCategory = "text"
      extractedText = await file.text()
    }

    let urls: string[] = []
    const enrichedUrls: Array<{ url: string; summary: string }> = []

    if (extractedText.length > 0) {
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g
      urls = extractedText.match(urlRegex) || []

      const { scrapeUrl } = await import("@/lib/firecrawl")
      const { summarize } = await import("@/lib/groq")

      for (const url of urls.slice(0, 3)) {
        try {
          const scraped = await scrapeUrl(url)
          if (scraped.content) {
            const summary = await summarize(scraped.content)
            enrichedUrls.push({ url, summary: summary.response })
          }
        } catch {
          enrichedUrls.push({ url, summary: "Failed to enrich" })
        }
      }
    }

    const { summarize } = await import("@/lib/groq")
    let docSummary: { response: string; model: string }

    if (extractedText.length > 50) {
      docSummary = await summarize(extractedText)
    } else {
      const { chat } = await import("@/lib/groq")
      const metaPrompt = `I have a file with the following metadata:
- File name: ${file.name}
- File type: ${file.type || "unknown"}
- File size: ${(file.size / 1024).toFixed(1)} KB
- File category: ${fileCategory}
${extractedText.length > 0 ? `- Partial extracted text: "${extractedText.slice(0, 500)}"` : "- No text could be extracted from this file."}

Based on the filename and any available information, provide a helpful description of what this file likely contains. If it is a PDF, note that the text extraction was limited and suggest the user verify the content manually.`

      const result = await chat([
        { role: "system", content: "You are a helpful file analysis assistant. Provide concise, informative descriptions based on available metadata. Use markdown formatting." },
        { role: "user", content: metaPrompt },
      ])
      docSummary = { response: result.response, model: result.model }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      fileCategory,
      textLength: extractedText.length,
      urlsFound: urls.length,
      enrichedUrls,
      summary: docSummary.response,
      model: docSummary.model,
    })
  } catch (error) {
    // Fallback to mock on error
    try {
      const formData = await req.clone().formData().catch(() => null)
      const file = formData?.get("file") as File | null
      if (file) {
        return NextResponse.json(getMockProcessResponse(file.name, file.size))
      }
    } catch {
      // ignore
    }
    const message = error instanceof Error ? error.message : "Processing failed"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
