"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Search,
  Send,
  Sparkles,
  Brain,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MorphingText } from "@/components/ui/morphing-text"
import { ParticleField } from "@/components/ui/particle-field"
import { GlowBorder } from "@/components/ui/glow-border"
import { AgentStatus, type AgentStep } from "@/components/ui/agent-status"
import { ConfidenceBar } from "@/components/shared/confidence-bar"
import { MarkdownContent } from "@/components/shared/markdown-content"
import { trackSearch } from "@/lib/activity-tracker"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/local-storage"
import { cn } from "@/lib/utils"
import { LottieAnimation } from "@/components/ui/lottie-animation"

type Source = {
  type: "external"
  label: string
  url: string
}

type SearchResult = {
  id: string
  query: string
  answer: string
  confidence: number
  sources: Source[]
  timestamp: string
}

const heroTexts = [
  "structural calculations",
  "building code compliance",
  "MEP coordination",
  "geotechnical reports",
  "seismic design criteria",
]

const exampleQueries = [
  "What is the design wind speed for Austin commercial buildings per ASCE 7-22?",
  "Compare moment connection vs shear connection for W18x55 beam",
  "Show IBC 2024 amendments for Texas fire-rated assemblies",
  "What foundation types work for expansive clay soils?",
  "HVAC duct sizing for high-rise above floor 20",
  "Load combination equations for LRFD steel design",
]

export function HomeSearch() {
  const [query, setQuery] = useState("")
  const [streamingText, setStreamingText] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([])
  const [agents, setAgents] = useState<AgentStep[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const resultsEndRef = useRef<HTMLDivElement>(null)

  // Load recent searches
  useEffect(() => {
    const history = getItem<SearchResult[]>(STORAGE_KEYS.SEARCH_HISTORY, [])
    setRecentSearches(history.slice(-8).reverse())
  }, [])

  // Listen for Cmd+K
  useEffect(() => {
    const handler = () => {
      const target = results.length > 0 ? inputRef.current : heroInputRef.current
      target?.focus()
    }
    window.addEventListener("ethd:focus-search", handler)
    return () => window.removeEventListener("ethd:focus-search", handler)
  }, [results.length])

  useEffect(() => {
    resultsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [results, streamingText])

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setIsSearching(true)
    setStreamingText("")
    setQuery("")

    // Show agent pipeline
    setAgents([
      { name: "Context", status: "running" },
      { name: "Perplexity", status: "idle" },
      { name: "Citations", status: "idle" },
      { name: "Rank", status: "idle" },
    ])

    try {
      // Simulate context detection phase
      await new Promise((r) => setTimeout(r, 300))
      setAgents((prev) => [
        { ...prev[0], status: "complete", durationMs: 120 },
        { ...prev[1], status: "running" },
        prev[2],
        prev[3],
      ])

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Search failed" }))
        throw new Error(errData.error || "Search failed")
      }

      // Read SSE stream
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let fullAnswer = ""
      let finalData: { confidence: number; sources: Source[]; citations: string[] } | null = null

      setAgents((prev) => [
        prev[0],
        { ...prev[1], status: "complete", durationMs: 800 },
        { ...prev[2], status: "running" },
        prev[3],
      ])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === "delta") {
              fullAnswer += data.content
              setStreamingText(fullAnswer)
            } else if (data.type === "done") {
              finalData = {
                confidence: data.confidence,
                sources: data.sources || [],
                citations: data.citations || [],
              }
            } else if (data.type === "error") {
              throw new Error(data.error)
            }
          } catch {
            // skip
          }
        }
      }

      setAgents((prev) => [
        prev[0],
        prev[1],
        { ...prev[2], status: "complete", durationMs: 200 },
        { ...prev[3], status: "complete", durationMs: 50 },
      ])

      const result: SearchResult = {
        id: `${Date.now()}`,
        query: q,
        answer: fullAnswer || streamingText,
        confidence: finalData?.confidence || 0.8,
        sources: finalData?.sources || [{ type: "external", label: "Perplexity", url: "" }],
        timestamp: new Date().toISOString(),
      }

      setResults((prev) => [...prev, result])
      setStreamingText("")

      // Persist to history
      trackSearch(q)
      const history = getItem<SearchResult[]>(STORAGE_KEYS.SEARCH_HISTORY, [])
      history.push(result)
      if (history.length > 50) history.splice(0, history.length - 50)
      setItem(STORAGE_KEYS.SEARCH_HISTORY, history)
      setRecentSearches(history.slice(-8).reverse())
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Search failed"
      setResults((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          query: q,
          answer: `Error: ${errMsg}. Check your API configuration in Settings.`,
          confidence: 0,
          sources: [],
          timestamp: new Date().toISOString(),
        },
      ])
      setStreamingText("")
    } finally {
      setIsSearching(false)
      setAgents([])
    }
  }, [query, streamingText])

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const showHero = results.length === 0 && !isSearching

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <ParticleField className="absolute inset-0 pointer-events-none opacity-40" />

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 p-4 pb-4 md:p-6">
          {showHero ? (
            <div className="flex flex-col items-center justify-center gap-8 pt-12 md:pt-20 max-w-4xl mx-auto">
              {/* Hero */}
              <div className="text-center animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/40">
                  <Sparkles className="h-3 w-3 text-yellow-400/60" />
                  Multi-Agent RAG • Neo4j • n8n Orchestration
                </div>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-3 bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent leading-[1.1] tracking-tight">
                  Search across
                </h2>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-[1.1] tracking-tight">
                  <MorphingText texts={heroTexts} interval={2500} />
                </h2>
                <p className="mt-4 text-sm md:text-base text-white/30 max-w-lg mx-auto">
                  Intelligent engineering document search powered by multi-agent orchestration, graph knowledge, and advanced OCR
                </p>
              </div>

              {/* Search bar */}
              <div className="w-full max-w-2xl animate-fade-in-delay">
                <GlowBorder>
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 h-5 w-5 text-white/20 z-10" />
                    <input
                      ref={heroInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
                      placeholder="Ask anything about engineering documents..."
                      className="w-full h-14 md:h-16 text-sm md:text-base pl-12 pr-28 bg-slate-900/80 border border-white/[0.08] text-white placeholder:text-white/20 rounded-2xl backdrop-blur-xl outline-none focus:border-blue-500/30 transition-colors"
                    />
                    <Button
                      onClick={() => handleSearch()}
                      disabled={!query.trim() || isSearching}
                      className="absolute right-2 h-10 px-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-xl text-sm"
                    >
                      Search
                    </Button>
                  </div>
                </GlowBorder>
              </div>

              {/* Example queries */}
              <div className="w-full max-w-3xl space-y-3 animate-fade-in-delay-2">
                <p className="text-center text-[11px] text-white/20 uppercase tracking-wider">Try asking</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {exampleQueries.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(q); handleSearch(q) }}
                      className="group p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-left hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-xs text-white/40 hover:text-white/60"
                    >
                      <span className="text-white/15 mr-2">→</span>
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="w-full max-w-2xl animate-fade-in-delay-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-3 w-3 text-white/20" />
                    <span className="text-[11px] text-white/20 uppercase tracking-wider">Recent</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 5).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setQuery(s.query); handleSearch(s.query) }}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] text-white/30 hover:text-white/50 hover:bg-white/[0.05] transition-all truncate max-w-[200px]"
                      >
                        {s.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-w-3xl mx-auto pt-4">
              <button
                onClick={() => { setResults([]); setQuery("") }}
                className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors w-fit"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                New Search
              </button>

              {results.map((result) => (
                <div key={result.id} className="flex flex-col gap-3 animate-slide-up">
                  {/* User query */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-xl rounded-br-sm bg-blue-500/10 px-4 py-2.5 border border-blue-500/15">
                      <p className="text-sm text-white/80">{result.query}</p>
                    </div>
                  </div>

                  {/* AI response */}
                  <Card className="bg-white/[0.02] border-white/[0.06] backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/15">
                            <Brain className="h-3 w-3 text-purple-400" />
                          </div>
                          <span className="text-[11px] font-medium text-white/40">AI Synopsis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ConfidenceBar score={result.confidence} />
                          <button
                            onClick={() => handleCopy(result.id, result.answer)}
                            className="p-1.5 text-white/20 hover:text-white/60 transition-colors"
                          >
                            {copied === result.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-white/70 leading-relaxed">
                        <MarkdownContent text={result.answer} />
                      </div>

                      {/* Clickable sources */}
                      {result.sources.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {result.sources.map((source, i) => (
                            source.url ? (
                              <a
                                key={i}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                {source.label}
                              </a>
                            ) : (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/30"
                              >
                                {source.label}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}

              {/* Streaming result */}
              {isSearching && (
                <div className="flex flex-col gap-3 animate-slide-up">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-xl rounded-br-sm bg-blue-500/10 px-4 py-2.5 border border-blue-500/15">
                      <p className="text-sm text-white/80">{query || results[results.length - 1]?.query || "..."}</p>
                    </div>
                  </div>
                  <Card className="bg-white/[0.02] border-white/[0.06] backdrop-blur-sm">
                    <CardContent className="p-4">
                      {agents.length > 0 && (
                        <div className="mb-3">
                          <AgentStatus agents={agents} />
                        </div>
                      )}
                      {streamingText ? (
                        <div className="text-sm text-white/70 leading-relaxed">
                          <MarkdownContent text={streamingText} />
                          <span className="inline-block w-2 h-4 bg-blue-400/60 animate-pulse ml-0.5" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-sm text-white/30">
                          <LottieAnimation src="/animations/search-pulse.json" style={{ width: 28, height: 28 }} />
                          Agents processing...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              <div ref={resultsEndRef} />
            </div>
          )}
        </div>

        {/* Bottom input */}
        {(results.length > 0 || isSearching) && (
          <div className="shrink-0 border-t border-white/[0.06] bg-slate-950/80 backdrop-blur-xl p-3">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/15" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
                  placeholder="Ask another question..."
                  className="w-full min-h-[44px] rounded-xl border border-white/[0.06] bg-white/[0.02] pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-colors"
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={!query.trim() || isSearching}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-blue-600 text-white hover:bg-blue-500"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
