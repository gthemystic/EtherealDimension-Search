export function getMockChatResponse(messages: Array<{ role: string; content: string }>): {
  response: string
  model: string
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
} {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const q = (lastUser?.content || '').toLowerCase()

  if (/beam|column|steel|w\d+x\d+/.test(q)) {
    return {
      response: `## W18×55 Beam Analysis — Lb = 15 ft

### Lateral-Torsional Buckling Check

For an unbraced length Lb = 15 ft with Cb = 1.0:

**Section Properties (W18×55):**
- ry = 1.67 in, rts = 1.98 in
- J = 1.66 in⁴, ho = 17.48 in
- Sx = 98.3 in³, Zx = 112 in³

**Limiting Lengths:**
- Lp = 1.76 × ry × √(E/Fy) = 1.76 × 1.67 × √(29000/50) = **70.8 in = 5.9 ft**
- Lr = 1.95 × rts × (E/0.7Fy) × √(J/(Sx×ho) + √((J/(Sx×ho))² + 6.76×(0.7Fy/E)²)) = **17.4 ft**

Since Lp (5.9 ft) < Lb (15 ft) < Lr (17.4 ft) → **Inelastic LTB zone**

**Nominal Moment:**
Mn = Cb × [Mp - (Mp - 0.7FySx) × (Lb - Lp)/(Lr - Lp)]
Mn = 1.0 × [5600 - (5600 - 3441) × (15 - 5.9)/(17.4 - 5.9)]
Mn = 5600 - 2159 × 0.791 = **4892 kip-in = 407.7 kip-ft**

φMn = 0.9 × 407.7 = **366.9 kip-ft**

### Shear Check
φVn = 211.9 kips (per AISC 360-22 Chapter G) — typically not governing for floor beams.

**References:** AISC 360-22 Chapter F, Table 3-2`,
      model: 'llama-3.3-70b-versatile',
      usage: { prompt_tokens: 245, completion_tokens: 612, total_tokens: 857 },
    }
  }

  if (/foundation|soil|clay|geotech|pier/.test(q)) {
    return {
      response: `## Drilled Pier Design in Expansive Clay — Austin, TX

### Soil Conditions
Based on typical Austin geotechnical profiles:
- **Surface layer (0-8 ft):** High-plasticity clay (CH), PI = 45, LL = 68
- **Active zone depth:** 12-15 ft (seasonal moisture variation)
- **Bearing stratum:** Austin Chalk at 18-25 ft depth
- **Groundwater:** Not encountered to 50 ft

### Design Recommendations

**Pier Geometry:**
- Minimum shaft diameter: 18 in (residential), 24 in (commercial)
- **Minimum embedment: 15 ft** into stable bearing stratum
- Penetrate minimum 3 ft into Austin Chalk
- Void box forms required under all grade beams (4" min void)

**Bearing Capacity:**
- Allowable end bearing on Austin Chalk: **3,000 psf** (conservative)
- Side friction in chalk: 1,500 psf (neglect friction in clay active zone)
- Factor of safety: 3.0 for dead + live

**Testing Requirements:**
- Atterberg limits per **ASTM D4318** on all clay samples
- Swell pressure tests per ASTM D4546
- Full-depth borings at each pier location for high-rise

### Key Cautions
1. **Never** found piers in the active clay zone
2. Isolate grade beams from soil movement with void boxes
3. Positive drainage away from foundations (5% min slope for 10 ft)
4. Consider post-tensioned slabs over conventional spread footings

**References:** TxDOT Geotechnical Manual, ASCE 7-22 §12.13`,
      model: 'llama-3.3-70b-versatile',
      usage: { prompt_tokens: 198, completion_tokens: 734, total_tokens: 932 },
    }
  }

  if (/ibc|asce|load\s*comb|lrfd/.test(q)) {
    return {
      response: `## ASCE 7-22 Load Combinations (§2.3.1 LRFD)

### Basic Combinations

| # | Combination | Use Case |
|---|---|---|
| 1 | 1.4D | Dead load only |
| 2 | 1.2D + 1.6L + 0.5(Lr or S or R) | Gravity dominant |
| 3 | 1.2D + 1.6(Lr or S or R) + (L or 0.5W) | Roof live/snow dominant |
| 4 | 1.2D + 1.0W + L + 0.5(Lr or S or R) | Wind dominant |
| 5 | 0.9D + 1.0W | Wind uplift |
| 6 | 1.2D + Ev + Eh + L + 0.2S | Seismic (additive) |
| 7 | 0.9D - Ev + Eh | Seismic (uplift) |

### Seismic Terms
- **Eh** = ρQE (horizontal seismic, ρ = redundancy factor)
- **Ev** = 0.2SDS×D (vertical seismic component)
- **SDS** = design spectral acceleration at short period

### Practical Notes
- Combination 2 typically governs for **floor beams and columns** in gravity frames
- Combinations 6-7 govern for **moment frames and braced frames** in SDC D-F
- L can be reduced to 0.5L in combinations 3-7 when L₀ ≤ 100 psf (except garages, assembly)
- **Do not** combine wind and seismic — ASCE 7 treats them as independent events

**References:** ASCE 7-22 §2.3, IBC 2024 §1605.2`,
      model: 'llama-3.3-70b-versatile',
      usage: { prompt_tokens: 167, completion_tokens: 589, total_tokens: 756 },
    }
  }

  // Default
  return {
    response: `I'd be happy to help with your engineering question. Could you provide more specific details about what you're looking for?

I can assist with:
- **Structural analysis** — beam design, column checks, connection details
- **Geotechnical engineering** — foundation design, soil analysis, bearing capacity
- **Building codes** — IBC 2024, ASCE 7-22, AISC 360-22, ACI 318
- **Load calculations** — wind, seismic, gravity combinations
- **MEP coordination** — HVAC sizing, electrical loads, plumbing systems

Please provide your specific query with parameters (spans, loads, soil conditions, etc.) for a detailed engineering response.`,
    model: 'llama-3.3-70b-versatile',
    usage: { prompt_tokens: 134, completion_tokens: 245, total_tokens: 379 },
  }
}
