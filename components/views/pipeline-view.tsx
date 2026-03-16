"use client"

import { useState, useEffect } from "react"
import {
  FileSearch,
  ScanEye,
  Scissors,
  Network,
  Search,
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  Workflow,
  Database,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { cn } from "@/lib/utils"

type ServiceStatus = {
  name: string
  icon: typeof FileSearch
  status: "connected" | "disconnected" | "checking" | "mocked"
  latencyMs?: number
  description: string
}

const pipelineStages = [
  {
    icon: FileSearch,
    name: "Document Ingestion",
    description: "MineRU-style document parsing and extraction",
    tools: ["PDF Parser", "DOCX Extractor", "Image Handler"],
    status: "active" as const,
  },
  {
    icon: ScanEye,
    name: "Multi-OCR Pipeline",
    description: "DeepSeek OCR 2 • Gemini 3 Flash • Mistral OCR",
    tools: ["Table Detection", "Equation Extraction", "Layout Analysis"],
    status: "active" as const,
  },
  {
    icon: Scissors,
    name: "Intelligent Chunking",
    description: "Chonkie-inspired semantic-aware chunking",
    tools: ["Heading Detection", "Table Preservation", "Overlap Control"],
    status: "active" as const,
  },
  {
    icon: Network,
    name: "Knowledge Graph",
    description: "Neo4j graph database for document relationships",
    tools: ["Entity Extraction", "Relationship Mapping", "Graph Indexing"],
    status: "active" as const,
  },
  {
    icon: Brain,
    name: "Multi-Agent RAG",
    description: "n8n orchestrated search with CRAG & PageIndex",
    tools: ["Context Detection", "Corrective RAG", "Citation Ranking"],
    status: "active" as const,
  },
  {
    icon: Search,
    name: "Search & Retrieval",
    description: "Perplexity sonar-pro with streaming results",
    tools: ["Semantic Search", "Code Search", "Web Enrichment"],
    status: "active" as const,
  },
]

export function PipelineView() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Perplexity (Search)", icon: Search, status: "disconnected", description: "AI-powered search engine" },
    { name: "Groq (LLM)", icon: Brain, status: "disconnected", description: "Fast AI inference" },
    { name: "Neo4j (Graph)", icon: Database, status: "disconnected", description: "Knowledge graph database" },
    { name: "n8n (Orchestration)", icon: Workflow, status: "disconnected", description: "Multi-agent workflows" },
    { name: "Firecrawl (Web)", icon: Globe, status: "disconnected", description: "Web scraping & enrichment" },
    { name: "GitHub (Code)", icon: FileSearch, status: "disconnected", description: "Code search & repos" },
  ])

  const testService = async (index: number) => {
    setServices((prev) => prev.map((s, i) => i === index ? { ...s, status: "checking" } : s))

    const start = Date.now()
    try {
      let res: Response
      const s = services[index]

      switch (s.name) {
        case "Perplexity (Search)":
          res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "ping" }) })
          break
        case "Groq (LLM)":
          res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }) })
          break
        case "Neo4j (Graph)":
          res = await fetch("/api/graph", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "health" }) })
          break
        case "n8n (Orchestration)":
          res = await fetch("/api/graph", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "health" }) })
          // n8n may not be running, mark as mocked
          setServices((prev) => prev.map((s, i) => i === index ? { ...s, status: "mocked", latencyMs: Date.now() - start } : s))
          return
        case "Firecrawl (Web)":
          res = await fetch("/api/crawl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "https://example.com" }) })
          break
        case "GitHub (Code)":
          res = await fetch("/api/github", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "searchRepos", query: "test" }) })
          break
        default:
          throw new Error("Unknown")
      }

      const data = await res.json()
      const latency = Date.now() - start
      setServices((prev) => prev.map((s, i) =>
        i === index ? { ...s, status: data.success !== false ? "connected" : "disconnected", latencyMs: latency } : s
      ))
    } catch {
      setServices((prev) => prev.map((s, i) => i === index ? { ...s, status: "disconnected", latencyMs: Date.now() - start } : s))
    }
  }

  const testAll = () => {
    services.forEach((_, i) => testService(i))
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6 max-w-4xl overflow-y-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Pipeline Architecture</h1>
        <p className="mt-1 text-sm text-white/30">Multi-agent RAG pipeline with intelligent document processing</p>
      </div>

      {/* Processing Pipeline */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-white/50 mb-3">Processing Pipeline</h2>
        {pipelineStages.map((stage, i) => (
          <GlassCard key={stage.name} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-blue-500/20">
                  <stage.icon className="h-4.5 w-4.5 text-blue-400" />
                </div>
                {i < pipelineStages.length - 1 && (
                  <div className="absolute ml-5 mt-12 h-6 w-px bg-gradient-to-b from-blue-500/30 to-transparent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white/80">{stage.name}</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400/60 border border-blue-500/20">
                    Stage {i + 1}
                  </span>
                </div>
                <p className="text-xs text-white/30 mt-0.5">{stage.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {stage.tools.map((tool) => (
                    <span key={tool} className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/25">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Service Status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white/50">Service Connections</h2>
          <Button size="sm" variant="outline" onClick={testAll} className="text-xs border-white/[0.08] text-white/40 hover:text-white">
            Test All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {services.map((service, i) => (
            <GlassCard key={service.name} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <service.icon className="h-4 w-4 text-white/30 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/60 truncate">{service.name}</p>
                  <p className="text-[10px] text-white/20">{service.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {service.latencyMs !== undefined && service.status === "connected" && (
                  <span className="text-[10px] text-emerald-400/50">{service.latencyMs}ms</span>
                )}
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  service.status === "connected" && "bg-emerald-400",
                  service.status === "disconnected" && "bg-white/15",
                  service.status === "checking" && "bg-blue-400 animate-pulse",
                  service.status === "mocked" && "bg-yellow-400",
                )} />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => testService(i)}
                  disabled={service.status === "checking"}
                  className="h-7 text-[10px] text-white/30 hover:text-white/60"
                >
                  {service.status === "checking" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-medium text-white/50 mb-3">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { label: "Search", value: "Perplexity sonar-pro" },
            { label: "LLM", value: "Groq (Llama 3.3)" },
            { label: "Graph DB", value: "Neo4j 5" },
            { label: "Orchestration", value: "n8n Workflows" },
            { label: "OCR", value: "DeepSeek / Gemini / Mistral" },
            { label: "Chunking", value: "Semantic (Chonkie)" },
            { label: "Doc Parse", value: "MineRU Pipeline" },
            { label: "RAG", value: "CRAG + PageIndex" },
          ].map((item) => (
            <div key={item.label} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-white/20 text-[10px]">{item.label}</p>
              <p className="text-white/50 font-medium mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
