const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1"

function getApiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) throw new Error("FIRECRAWL_API_KEY not set")
  return key
}

export async function scrapeUrl(url: string) {
  const res = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Firecrawl scrape error: ${res.status} - ${error}`)
  }

  const data = await res.json()
  return {
    content: data.data?.markdown || data.data?.content || "",
    metadata: data.data?.metadata || {},
    url: data.data?.url || url,
  }
}

export async function searchAndScrape(query: string) {
  const res = await fetch(`${FIRECRAWL_API_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      query,
      limit: 5,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Firecrawl search error: ${res.status} - ${error}`)
  }

  const data = await res.json()
  return {
    results: data.data || [],
    totalCount: data.data?.length || 0,
  }
}
