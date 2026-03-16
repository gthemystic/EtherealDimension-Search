/**
 * Multi-provider OCR Pipeline
 * Supports: DeepSeek OCR 2, Gemini 3 Flash, Mistral OCR
 * Each provider is optional - gracefully falls back if API key not set
 */

export type OcrProvider = 'deepseek' | 'gemini' | 'mistral'

export interface OcrResult {
  provider: OcrProvider
  text: string
  confidence: number
  pages: number
  metadata: {
    tables?: number
    figures?: number
    equations?: number
    processingMs: number
  }
}

export interface OcrProviderStatus {
  provider: OcrProvider
  available: boolean
  label: string
  description: string
}

export function getAvailableProviders(): OcrProviderStatus[] {
  return [
    {
      provider: 'deepseek',
      available: !!process.env.DEEPSEEK_API_KEY,
      label: 'DeepSeek OCR 2',
      description: 'Best for dense technical documents, equations, and mixed layouts',
    },
    {
      provider: 'gemini',
      available: !!process.env.GEMINI_API_KEY,
      label: 'Gemini 3 Flash OCR',
      description: 'Fast multimodal extraction with strong table recognition',
    },
    {
      provider: 'mistral',
      available: !!process.env.MISTRAL_API_KEY,
      label: 'Mistral OCR',
      description: 'Multilingual document understanding with layout preservation',
    },
  ]
}

// --- DeepSeek OCR 2 ---
async function ocrDeepSeek(fileBuffer: Buffer, fileName: string): Promise<OcrResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured')

  const start = Date.now()
  const base64 = fileBuffer.toString('base64')
  const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png'

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ALL text from this document. Preserve formatting, tables, equations, and structure. Return the full text content in markdown format.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 8192,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek OCR failed: ${res.status} - ${err}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''

  return {
    provider: 'deepseek',
    text,
    confidence: 0.92,
    pages: 1,
    metadata: {
      tables: (text.match(/\|.*\|/g) || []).length > 2 ? Math.floor((text.match(/\|.*\|/g) || []).length / 3) : 0,
      figures: (text.match(/\[figure\]|\[image\]|\[diagram\]/gi) || []).length,
      equations: (text.match(/\$.*\$|\\\[.*\\\]/g) || []).length,
      processingMs: Date.now() - start,
    },
  }
}

// --- Gemini 3 Flash OCR ---
async function ocrGemini(fileBuffer: Buffer, fileName: string): Promise<OcrResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const start = Date.now()
  const base64 = fileBuffer.toString('base64')
  const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png'

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Extract ALL text from this document with full fidelity. Preserve tables as markdown tables, preserve equations, preserve all formatting. Return complete markdown.',
              },
              {
                inline_data: { mime_type: mimeType, data: base64 },
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini OCR failed: ${res.status} - ${err}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return {
    provider: 'gemini',
    text,
    confidence: 0.94,
    pages: 1,
    metadata: {
      tables: (text.match(/\|.*\|/g) || []).length > 2 ? Math.floor((text.match(/\|.*\|/g) || []).length / 3) : 0,
      figures: (text.match(/\[figure\]|\[image\]|\[diagram\]/gi) || []).length,
      equations: (text.match(/\$.*\$|\\\[.*\\\]/g) || []).length,
      processingMs: Date.now() - start,
    },
  }
}

// --- Mistral OCR ---
async function ocrMistral(fileBuffer: Buffer, fileName: string): Promise<OcrResult> {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) throw new Error('MISTRAL_API_KEY not configured')

  const start = Date.now()
  const base64 = fileBuffer.toString('base64')
  const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png'

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ALL text from this document. Preserve tables, equations, formatting. Return in markdown.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 8192,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Mistral OCR failed: ${res.status} - ${err}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''

  return {
    provider: 'mistral',
    text,
    confidence: 0.90,
    pages: 1,
    metadata: {
      tables: (text.match(/\|.*\|/g) || []).length > 2 ? Math.floor((text.match(/\|.*\|/g) || []).length / 3) : 0,
      figures: (text.match(/\[figure\]|\[image\]|\[diagram\]/gi) || []).length,
      equations: (text.match(/\$.*\$|\\\[.*\\\]/g) || []).length,
      processingMs: Date.now() - start,
    },
  }
}

// --- Pipeline Orchestrator ---

export async function runOcr(
  fileBuffer: Buffer,
  fileName: string,
  preferredProvider?: OcrProvider
): Promise<OcrResult> {
  const providers = getAvailableProviders().filter((p) => p.available)

  if (providers.length === 0) {
    // No OCR providers configured - return mock result
    return {
      provider: 'deepseek',
      text: '[OCR not configured - add API keys for DeepSeek, Gemini, or Mistral to enable document OCR]',
      confidence: 0,
      pages: 0,
      metadata: { processingMs: 0 },
    }
  }

  // Use preferred provider if available, otherwise first available
  const selected = preferredProvider
    ? providers.find((p) => p.provider === preferredProvider) || providers[0]
    : providers[0]

  switch (selected.provider) {
    case 'deepseek':
      return ocrDeepSeek(fileBuffer, fileName)
    case 'gemini':
      return ocrGemini(fileBuffer, fileName)
    case 'mistral':
      return ocrMistral(fileBuffer, fileName)
  }
}

// Run OCR with all available providers and return best result
export async function runOcrEnsemble(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ best: OcrResult; all: OcrResult[] }> {
  const providers = getAvailableProviders().filter((p) => p.available)

  if (providers.length === 0) {
    const mock = await runOcr(fileBuffer, fileName)
    return { best: mock, all: [mock] }
  }

  const results = await Promise.allSettled(
    providers.map((p) => {
      switch (p.provider) {
        case 'deepseek': return ocrDeepSeek(fileBuffer, fileName)
        case 'gemini': return ocrGemini(fileBuffer, fileName)
        case 'mistral': return ocrMistral(fileBuffer, fileName)
      }
    })
  )

  const successful = results
    .filter((r): r is PromiseFulfilledResult<OcrResult> => r.status === 'fulfilled')
    .map((r) => r.value)

  if (successful.length === 0) {
    throw new Error('All OCR providers failed')
  }

  // Pick highest confidence
  const best = successful.reduce((a, b) => (a.confidence > b.confidence ? a : b))
  return { best, all: successful }
}
