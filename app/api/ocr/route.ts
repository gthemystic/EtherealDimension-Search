import { NextRequest, NextResponse } from 'next/server'
import { isMockEnabled } from '@/lib/feature-flags'

const MOCK_OCR_RESULT = {
  success: true,
  result: {
    provider: 'deepseek' as const,
    text: `# Structural Engineering Calculations

## Project: Tower A — Austin, TX
**Engineer:** Pacific Structural Group
**Date:** 2026-03-01

### 1. Design Criteria
- **Building Code:** IBC 2024 with Austin amendments
- **Steel Design:** AISC 360-22 (LRFD)
- **Concrete Design:** ACI 318-19
- **Seismic:** ASCE 7-22, SDC D (Ss=1.2g, S1=0.5g)
- **Wind:** 115 mph ultimate, Exposure C

### 2. Material Specifications
| Material | Grade | Fy (ksi) | Fu (ksi) |
|---|---|---|---|
| Wide Flange | A992 | 50 | 65 |
| Plates | A36 | 36 | 58 |
| Bolts | A325-N | — | 120 |
| Concrete | 4000 psi | — | — |

### 3. Gravity Load Summary
- Dead Load (DL): 85 psf typical floor
- Live Load (LL): 50 psf office, 100 psf lobby
- Superimposed DL: 15 psf MEP + finishes`,
    confidence: 0.92,
    pages: 3,
    metadata: {
      tables: 2,
      figures: 0,
      equations: 0,
      processingMs: 1850,
    },
  },
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const provider = formData.get('provider') as string | null
    const ensemble = formData.get('ensemble') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'File required' }, { status: 400 })
    }

    // Mock guard
    if (isMockEnabled('ocr')) {
      if (ensemble) {
        return NextResponse.json({ success: true, best: MOCK_OCR_RESULT.result, all: [MOCK_OCR_RESULT.result] })
      }
      return NextResponse.json(MOCK_OCR_RESULT)
    }

    const { runOcr, runOcrEnsemble } = await import('@/lib/ocr-pipeline')
    const buffer = Buffer.from(await file.arrayBuffer())

    if (ensemble) {
      const result = await runOcrEnsemble(buffer, file.name)
      return NextResponse.json({ success: true, ...result })
    } else {
      const result = await runOcr(buffer, file.name, (provider as 'deepseek' | 'gemini' | 'mistral') || undefined)
      return NextResponse.json({ success: true, result })
    }
  } catch (error) {
    // Fallback to mock
    if (isMockEnabled('ocr')) {
      return NextResponse.json(MOCK_OCR_RESULT)
    }
    const message = error instanceof Error ? error.message : 'OCR failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  if (isMockEnabled('ocr')) {
    return NextResponse.json({
      providers: [
        { provider: 'deepseek', available: false, label: 'DeepSeek OCR 2', description: 'Best for dense technical documents (demo mode)' },
        { provider: 'gemini', available: false, label: 'Gemini 3 Flash OCR', description: 'Fast multimodal extraction (demo mode)' },
        { provider: 'mistral', available: false, label: 'Mistral OCR', description: 'Multilingual document understanding (demo mode)' },
      ],
    })
  }

  const { getAvailableProviders } = await import('@/lib/ocr-pipeline')
  const providers = getAvailableProviders()
  return NextResponse.json({ providers })
}
