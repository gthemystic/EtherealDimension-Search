interface MockSearchData {
  answer: string
  confidence: number
  citations: string[]
  sources: Array<{ type: string; label: string; url: string }>
}

function pickSearchResult(query: string): MockSearchData {
  const q = query.toLowerCase()

  if (/wind|asce\s*7/.test(q)) {
    return {
      answer: `## Wind Load Analysis — Austin, TX (ASCE 7-22)

Per **ASCE 7-22 Figure 26.5-1B**, the basic wind speed for Austin, Texas is:

- **Ultimate (V_ult):** 115 mph (Risk Category II)
- **Exposure Category:** C (open terrain, scattered obstructions <30 ft)

### Design Wind Pressure Calculation

| Parameter | Value | Reference |
|---|---|---|
| V_ult | 115 mph | Fig 26.5-1B |
| K_d (directionality) | 0.85 | Table 26.6-1 |
| K_zt (topographic) | 1.0 | Section 26.8 |
| K_e (ground elevation) | 1.0 | Table 26.9-1 |

**Velocity pressure (qz):**
qz = 0.00256 × K_z × K_zt × K_d × K_e × V² = 0.00256 × 0.85 × 1.0 × 0.85 × 1.0 × 115² = 24.5 psf (at 30 ft)

**ASD conversion:** V_asd = V_ult × √0.6 = 115 × 0.775 = 89.1 mph

> Note: Always verify with local amendments. Austin may adopt additional requirements beyond ASCE 7 minimums.`,
      confidence: 0.92,
      citations: [
        'https://www.asce.org/asce-7',
        'https://codes.iccsafe.org/codes/texas',
        'https://up.codes/viewer/texas/ibc-2024',
      ],
      sources: [
        { type: 'external', label: 'ASCE 7-22 Standard', url: 'https://www.asce.org/asce-7' },
        { type: 'external', label: 'ICC Texas Codes', url: 'https://codes.iccsafe.org/codes/texas' },
        { type: 'external', label: 'UpCodes Texas IBC', url: 'https://up.codes/viewer/texas/ibc-2024' },
      ],
    }
  }

  if (/beam|w18|steel\s*design/.test(q)) {
    return {
      answer: `## W18×55 Steel Beam — LRFD Design Check

**Material:** ASTM A992 Grade 50 (Fy = 50 ksi, Fu = 65 ksi)

### Flexural Capacity

| Property | Value |
|---|---|
| Zx (plastic modulus) | 112 in³ |
| Sx (elastic modulus) | 98.3 in³ |
| Mp = Fy × Zx | 50 × 112 = 5,600 kip-in = **466.7 kip-ft** |
| φMn (φ = 0.9) | **420.0 kip-ft** |

### Shear Capacity

| Property | Value |
|---|---|
| d (depth) | 18.11 in |
| tw (web thickness) | 0.390 in |
| Vn = 0.6 × Fy × d × tw | 0.6 × 50 × 18.11 × 0.39 = **211.9 kips** |
| φVn (φ = 1.0) | **211.9 kips** |

### Compactness Check (AISC 360 Table B4.1b)
- Flange: bf/2tf = 7.53/2(0.630) = 5.98 < λp = 9.15 ✓ **Compact**
- Web: h/tw = 15.2/0.39 = 39.0 < λp = 90.6 ✓ **Compact**

> Per AISC 360-22, W18×55 is adequate for typical floor beam applications with spans up to ~30 ft under uniform loading.`,
      confidence: 0.95,
      citations: [
        'https://www.aisc.org/publications/steel-construction-manual',
        'https://www.astm.org/a0992_a0992m-11.html',
      ],
      sources: [
        { type: 'external', label: 'AISC Steel Manual', url: 'https://www.aisc.org/publications/steel-construction-manual' },
        { type: 'external', label: 'ASTM A992 Spec', url: 'https://www.astm.org/a0992_a0992m-11.html' },
      ],
    }
  }

  if (/fire|ibc|fire.?rat/.test(q)) {
    return {
      answer: `## IBC 2024 Fire-Resistance Ratings (Table 601)

### Building Construction Types

| Element | Type I-A | Type I-B | Type II-A | Type II-B | Type III-A |
|---|---|---|---|---|---|
| Structural frame | 3 hr | 2 hr | 1 hr | 0 hr | 1 hr |
| Bearing walls (ext) | 3 hr | 2 hr | 1 hr | 0 hr | 2 hr |
| Floor construction | 2 hr | 2 hr | 1 hr | 0 hr | 1 hr |
| Roof construction | 1.5 hr | 1 hr | 1 hr | 0 hr | 1 hr |

### Key References

- **UL Design No. U419:** 2-hour rated steel beam with spray-applied fireproofing (1-1/8" minimum thickness)
- **Testing Standard:** ASTM E119 — Standard Test Methods for Fire Tests of Building Construction
- **Austin Amendment §1.101.3:** Local fire code requires automatic sprinklers in all buildings >5,000 sq ft

### Practical Notes

1. Type I-A is required for **high-rise buildings** (>75 ft per IBC §403)
2. Sprinkler trade-offs per IBC §403.3 allow 1-hour reduction in some assemblies
3. Fire-resistance ratings must be tested assemblies — field modifications void the rating

> Always cross-reference with the local fire marshal's office for Austin-specific requirements.`,
      confidence: 0.88,
      citations: [
        'https://codes.iccsafe.org/content/IBC2024P7',
        'https://www.ul.com/resources/fire-resistance-directory',
        'https://www.astm.org/e0119-20.html',
      ],
      sources: [
        { type: 'external', label: 'IBC 2024', url: 'https://codes.iccsafe.org/content/IBC2024P7' },
        { type: 'external', label: 'UL Fire Directory', url: 'https://www.ul.com/resources/fire-resistance-directory' },
        { type: 'external', label: 'ASTM E119', url: 'https://www.astm.org/e0119-20.html' },
      ],
    }
  }

  // Default fallback
  return {
    answer: `## Ethereal Dimension Search

I searched across engineering databases, building codes, and technical standards for your query: "${query}"

This platform integrates:
- **Perplexity sonar-pro** for real-time engineering knowledge
- **Neo4j** graph database linking documents, codes, and entities
- **GitHub** code search across structural engineering repositories
- **Firecrawl** for deep web content extraction

Try specific queries like:
- "ASCE 7-22 wind speed for Austin TX"
- "W18x55 beam LRFD capacity check"
- "IBC 2024 fire-resistance ratings Type I-A"
- "Drilled pier design in expansive clay"

> Tip: The more specific your query, the more precise the engineering response.`,
    confidence: 0.75,
    citations: [],
    sources: [{ type: 'external', label: 'Perplexity sonar-pro', url: '' }],
  }
}

export function createMockSearchStream(query: string): ReadableStream {
  const data = pickSearchResult(query)
  const encoder = new TextEncoder()
  const chunkSize = 30

  return new ReadableStream({
    async start(controller) {
      // Split answer into chunks and stream as deltas
      for (let i = 0; i < data.answer.length; i += chunkSize) {
        const slice = data.answer.slice(i, i + chunkSize)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: slice })}\n\n`)
        )
        // Small delay between chunks for streaming effect
        await new Promise((r) => setTimeout(r, 15))
      }

      // Send done event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'done',
            answer: data.answer,
            confidence: data.confidence,
            sources: data.sources,
            citations: data.citations,
          })}\n\n`
        )
      )
      controller.close()
    },
  })
}
