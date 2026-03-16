import Groq from "groq-sdk"

let client: Groq | null = null

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error("GROQ_API_KEY not set")
    client = new Groq({ apiKey })
  }
  return client
}

type Message = { role: "system" | "user" | "assistant"; content: string }

export async function chat(messages: Message[], model?: string) {
  const groq = getClient()
  const completion = await groq.chat.completions.create({
    model: model || "llama-3.3-70b-versatile",
    messages,
    max_tokens: 4096,
    temperature: 0.3,
  })

  return {
    response: completion.choices[0]?.message?.content || "",
    model: completion.model,
    usage: completion.usage,
  }
}

export async function summarize(text: string) {
  return chat([
    {
      role: "system",
      content: "Summarize the following content concisely, preserving key technical details, numerical values, and specifications. Use markdown formatting.",
    },
    { role: "user", content: text.slice(0, 12000) },
  ])
}
