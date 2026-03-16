"use client"

import { useState, useEffect } from "react"
import {
  Globe,
  Zap,
  Database,
  Github,
  CheckCircle2,
  Save,
  Loader2,
  Workflow,
  ScanEye,
  FlaskConical,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/local-storage"
import { cn } from "@/lib/utils"
import { isClientMockMode } from "@/lib/feature-flags"

type ConnectionStatus = "connected" | "disconnected" | "testing" | "error"

type ServiceConfig = {
  name: string
  icon: typeof Globe
  status: ConnectionStatus
  latencyMs?: number
  errorDetail?: string
}

type ModelConfig = {
  searchModel: string
  chatModel: string
}

export function SettingsView() {
  const [services, setServices] = useState<ServiceConfig[]>([
    { name: "Perplexity (Search)", icon: Globe, status: "disconnected" },
    { name: "Groq (LLM)", icon: Zap, status: "disconnected" },
    { name: "Neo4j (Graph DB)", icon: Database, status: "disconnected" },
    { name: "n8n (Orchestration)", icon: Workflow, status: "disconnected" },
    { name: "GitHub (Code)", icon: Github, status: "disconnected" },
    { name: "OCR Pipeline", icon: ScanEye, status: "disconnected" },
  ])
  const [saved, setSaved] = useState(false)
  const [modelConfig, setModelConfig] = useState<ModelConfig>({ searchModel: "sonar-pro", chatModel: "llama-3.3-70b-versatile" })

  // Load persisted state
  useEffect(() => {
    const savedConfig = getItem<ModelConfig>(STORAGE_KEYS.MODEL_CONFIG, modelConfig)
    setModelConfig(savedConfig)
    const savedStatus = getItem<Array<{ name: string; status: ConnectionStatus }>>(STORAGE_KEYS.CONNECTION_STATUS, [])
    if (savedStatus.length > 0) {
      setServices((prev) => prev.map((s) => {
        const found = savedStatus.find((ss) => ss.name === s.name)
        return found ? { ...s, status: found.status } : s
      }))
    }
  }, [])

  const testConnection = async (index: number) => {
    setServices((prev) => prev.map((s, i) => i === index ? { ...s, status: "testing", latencyMs: undefined, errorDetail: undefined } : s))

    const start = Date.now()
    try {
      let res: Response
      const service = services[index]

      switch (service.name) {
        case "Perplexity (Search)":
          res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "test" }) })
          break
        case "Groq (LLM)":
          res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }) })
          break
        case "Neo4j (Graph DB)":
          res = await fetch("/api/graph", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "health" }) })
          break
        case "n8n (Orchestration)":
          // n8n uses its own health check
          try {
            res = await fetch("http://localhost:5678/healthz", { signal: AbortSignal.timeout(3000) })
          } catch {
            setServices((prev) => prev.map((s, i) => i === index ? { ...s, status: "disconnected", latencyMs: Date.now() - start, errorDetail: "n8n not running (start with docker-compose up)" } : s))
            return
          }
          break
        case "GitHub (Code)":
          res = await fetch("/api/github", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "searchRepos", query: "test" }) })
          break
        case "OCR Pipeline":
          res = await fetch("/api/ocr", { method: "GET" })
          break
        default:
          throw new Error("Unknown service")
      }

      const latency = Date.now() - start
      const data = await res.json()
      const success = data.success !== false && data.error === undefined
      const newStatus: ConnectionStatus = success ? "connected" : "error"
      const errorDetail = !success ? (data.error || "Connection failed") : undefined

      setServices((prev) => {
        const updated = prev.map((s, i) => i === index ? { ...s, status: newStatus, latencyMs: latency, errorDetail } : s)
        // Persist
        setItem(STORAGE_KEYS.CONNECTION_STATUS, updated.map((s) => ({ name: s.name, status: s.status })))
        return updated
      })
    } catch (err) {
      setServices((prev) => prev.map((s, i) => i === index ? { ...s, status: "error", latencyMs: Date.now() - start, errorDetail: err instanceof Error ? err.message : "Failed" } : s))
    }
  }

  const testAll = () => services.forEach((_, i) => testConnection(i))

  const handleSave = () => {
    setItem(STORAGE_KEYS.MODEL_CONFIG, modelConfig)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const mockMode = isClientMockMode()

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6 max-w-2xl overflow-y-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-white/30">Configure your search pipeline</p>
      </div>

      {/* Mock Mode Indicator */}
      <GlassCard className={cn("p-4 border", mockMode ? "border-amber-500/20 bg-amber-500/[0.03]" : "border-emerald-500/20 bg-emerald-500/[0.03]")}>
        <div className="flex items-center gap-3">
          {mockMode ? (
            <FlaskConical className="h-5 w-5 text-amber-400" />
          ) : (
            <Radio className="h-5 w-5 text-emerald-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-semibold", mockMode ? "text-amber-400" : "text-emerald-400")}>
                {mockMode ? "DEMO MODE" : "LIVE"}
              </span>
              <span className={cn("inline-block h-2 w-2 rounded-full", mockMode ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
            </div>
            <p className="text-xs text-white/30 mt-0.5">
              {mockMode
                ? "Running with mock data. Set NEXT_PUBLIC_MOCK_MODE=false and add API keys to go live."
                : "Connected to live services. API keys are configured."}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Status dots */}
      <div className="flex items-center gap-4 flex-wrap">
        {services.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2 w-2 rounded-full", s.status === "connected" && "bg-emerald-400", s.status === "disconnected" && "bg-white/15", s.status === "testing" && "bg-blue-400 animate-pulse", s.status === "error" && "bg-red-400")} />
            <span className="text-[10px] text-white/25">{s.name.split(" (")[0]}</span>
          </div>
        ))}
      </div>

      {/* Connections */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white/60">API Connections</h3>
          <Button size="sm" variant="outline" onClick={testAll} className="text-xs border-white/[0.08] text-white/40">Test All</Button>
        </div>
        <div className="flex flex-col gap-2">
          {services.map((service, i) => (
            <div key={service.name} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <service.icon className="h-4 w-4 text-white/25 shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm text-white/60 block truncate">{service.name}</span>
                  {service.errorDetail && service.status === "error" && (
                    <span className="text-[10px] text-red-400/60 block truncate">{service.errorDetail}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {service.latencyMs !== undefined && service.status === "connected" && (
                  <span className="text-[10px] text-emerald-400/50">{service.latencyMs}ms</span>
                )}
                <div className={cn("h-2 w-2 rounded-full", service.status === "connected" && "bg-emerald-400", service.status === "disconnected" && "bg-white/15", service.status === "testing" && "bg-blue-400 animate-pulse", service.status === "error" && "bg-red-400")} />
                <Button size="sm" variant="ghost" onClick={() => testConnection(i)} disabled={service.status === "testing"} className="text-xs h-8 text-white/30">
                  {service.status === "testing" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Model Config */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Model Configuration</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/25">Search Model</label>
            <select
              value={modelConfig.searchModel}
              onChange={(e) => setModelConfig((prev) => ({ ...prev, searchModel: e.target.value }))}
              className="w-full min-h-[44px] rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 text-sm text-white/60 outline-none focus:border-blue-500/30"
            >
              <option value="sonar-pro" className="bg-slate-900">sonar-pro</option>
              <option value="sonar" className="bg-slate-900">sonar</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/25">Chat Model</label>
            <select
              value={modelConfig.chatModel}
              onChange={(e) => setModelConfig((prev) => ({ ...prev, chatModel: e.target.value }))}
              className="w-full min-h-[44px] rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 text-sm text-white/60 outline-none focus:border-blue-500/30"
            >
              <option value="llama-3.3-70b-versatile" className="bg-slate-900">llama-3.3-70b-versatile</option>
              <option value="llama-3.1-8b-instant" className="bg-slate-900">llama-3.1-8b-instant</option>
              <option value="mixtral-8x7b-32768" className="bg-slate-900">mixtral-8x7b-32768</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <Button onClick={handleSave} className="min-h-[44px] bg-blue-600 text-white hover:bg-blue-500">
        {saved ? <><CheckCircle2 className="mr-2 h-4 w-4" />Saved</> : <><Save className="mr-2 h-4 w-4" />Save Configuration</>}
      </Button>
    </div>
  )
}
