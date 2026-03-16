export type ServiceName = 'search' | 'chat' | 'graph' | 'github' | 'crawl' | 'process' | 'ocr'

const SERVICE_ENV_OVERRIDES: Record<ServiceName, string> = {
  search: 'MOCK_SEARCH',
  chat: 'MOCK_CHAT',
  graph: 'MOCK_GRAPH',
  github: 'MOCK_GITHUB',
  crawl: 'MOCK_CRAWL',
  process: 'MOCK_PROCESS',
  ocr: 'MOCK_OCR',
}

const SERVICE_REQUIRED_KEYS: Record<ServiceName, string[]> = {
  search: ['PERPLEXITY_API_KEY'],
  chat: ['GROQ_API_KEY'],
  process: ['GROQ_API_KEY'],
  github: ['GITHUB_PAT_TOKEN'],
  crawl: ['FIRECRAWL_API_KEY'],
  graph: ['NEO4J_URI'],
  ocr: ['DEEPSEEK_API_KEY', 'GEMINI_API_KEY', 'MISTRAL_API_KEY'],
}

function isGlobalMock(): boolean {
  return (
    process.env.NEXT_PUBLIC_MOCK_MODE === 'true' ||
    process.env.MOCK_MODE === 'true'
  )
}

export function isMockEnabled(service: ServiceName): boolean {
  if (isGlobalMock()) return true

  const override = SERVICE_ENV_OVERRIDES[service]
  if (process.env[override] === 'true') return true

  // Smart fallback: auto-mock if required keys are missing
  const requiredKeys = SERVICE_REQUIRED_KEYS[service]
  if (service === 'graph') {
    // Graph has defaults, only mock if explicitly overridden
    return false
  }
  if (service === 'ocr') {
    // OCR needs at least one provider key
    return !requiredKeys.some((k) => !!process.env[k])
  }
  return !requiredKeys.some((k) => !!process.env[k])
}

export function isClientMockMode(): boolean {
  if (typeof window === 'undefined') return false
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
}

export function getServiceStatus(): Record<ServiceName, { mock: boolean; reason: string }> {
  const services: ServiceName[] = ['search', 'chat', 'graph', 'github', 'crawl', 'process', 'ocr']
  const result = {} as Record<ServiceName, { mock: boolean; reason: string }>

  for (const service of services) {
    if (isGlobalMock()) {
      result[service] = { mock: true, reason: 'Global mock mode enabled' }
      continue
    }

    const override = SERVICE_ENV_OVERRIDES[service]
    if (process.env[override] === 'true') {
      result[service] = { mock: true, reason: `Per-service mock override (${override})` }
      continue
    }

    const requiredKeys = SERVICE_REQUIRED_KEYS[service]
    if (service === 'graph') {
      result[service] = { mock: false, reason: 'Live — defaults configured' }
      continue
    }

    if (service === 'ocr') {
      const hasAny = requiredKeys.some((k) => !!process.env[k])
      result[service] = hasAny
        ? { mock: false, reason: 'Live — OCR provider configured' }
        : { mock: true, reason: 'API key missing (DEEPSEEK/GEMINI/MISTRAL)' }
      continue
    }

    const hasKey = requiredKeys.some((k) => !!process.env[k])
    result[service] = hasKey
      ? { mock: false, reason: `Live — API key configured` }
      : { mock: true, reason: `API key missing (${requiredKeys[0]})` }
  }

  return result
}
