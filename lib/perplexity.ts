const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

function getApiKey(): string {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) throw new Error("PERPLEXITY_API_KEY not set")
  return key
}

export async function searchEngineering(query: string, context?: string) {
  const systemPrompt = context || `You are an expert engineering document search assistant. Provide detailed, technical answers about structural engineering, MEP coordination, building codes (IBC, ASCE 7), geotechnical engineering, and construction. Always cite sources when possible. Format your response with markdown for clarity.`

  const res = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      max_tokens: 4096,
      temperature: 0.2,
      return_citations: true,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Perplexity API error: ${res.status} - ${error}`)
  }

  const data = await res.json()
  return {
    answer: data.choices?.[0]?.message?.content || "",
    citations: data.citations || [],
    model: data.model,
    usage: data.usage,
  }
}
