export function getMockProcessResponse(fileName: string, fileSize: number) {
  return {
    success: true,
    fileName,
    fileSize,
    fileCategory: 'pdf' as const,
    textLength: 24850,
    urlsFound: 3,
    enrichedUrls: [
      { url: 'https://www.aisc.org/publications/steel-construction-manual', summary: 'AISC Steel Construction Manual \u2014 comprehensive reference for structural steel design including section properties, design tables, and connection details per AISC 360-22.' },
      { url: 'https://www.astm.org/a0992_a0992m-11.html', summary: 'ASTM A992/A992M \u2014 Standard specification for structural steel shapes. Minimum Fy=50 ksi, Fu=65 ksi. Covers W, HP, and S shapes.' },
      { url: 'https://codes.iccsafe.org/content/IBC2024P7', summary: 'International Building Code 2024 \u2014 model code for building design and construction. Covers structural, fire, accessibility, and means of egress requirements.' },
    ],
    summary: `## Structural Engineering Calculations

**Document Type:** Engineering calculation package

### Specifications Referenced
- **Steel:** ASTM A992 Grade 50 (Fy = 50 ksi, Fu = 65 ksi)
- **Concrete:** f'c = 4,000 psi normal weight (150 pcf)
- **Seismic Design Category:** D (Ss = 1.2g, S1 = 0.5g)
- **Wind Speed:** 115 mph ultimate (ASCE 7-22, Exposure C)

### Contents
1. Gravity load takedown (DL + LL)
2. Lateral analysis \u2014 wind and seismic
3. Steel beam and column design
4. Foundation recommendations
5. Connection design details

*Processed with Ethereal Dimension document pipeline.*`,
    model: 'llama-3.3-70b-versatile',
  }
}

export function getMockCrawlResponse(url?: string, query?: string) {
  if (url) {
    return {
      success: true,
      url,
      title: 'Engineering Standards & Technical Resources',
      content: `# Engineering Standards Reference

This page contains technical standards and specifications commonly referenced in structural engineering practice.

## Key Standards
- **AISC 360-22** \u2014 Specification for Structural Steel Buildings
- **ASCE 7-22** \u2014 Minimum Design Loads and Associated Criteria
- **ACI 318-19** \u2014 Building Code Requirements for Structural Concrete
- **IBC 2024** \u2014 International Building Code

## Material Properties
| Material | Grade | Fy (ksi) | Fu (ksi) |
|---|---|---|---|
| A992 Steel | 50 | 50 | 65 |
| A36 Steel | 36 | 36 | 58 |
| A572 Gr 50 | 50 | 50 | 65 |

Source: AISC Steel Construction Manual, 16th Edition`,
      metadata: { statusCode: 200, contentType: 'text/html' },
    }
  }

  return {
    success: true,
    results: [
      { url: 'https://www.aisc.org/360', title: 'AISC 360-22 Specification', content: 'The specification for structural steel buildings covers material, design, fabrication, and erection requirements.', score: 0.95 },
      { url: 'https://www.asce.org/asce-7', title: 'ASCE 7-22 Load Standard', content: 'Minimum design loads and associated criteria for buildings and other structures.', score: 0.91 },
    ],
  }
}
