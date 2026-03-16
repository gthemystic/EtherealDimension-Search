"use client"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  Link2,
  ScanEye,
  Scissors,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GlassCard } from "@/components/shared/glass-card"
import { MarkdownContent } from "@/components/shared/markdown-content"
import { trackUpload } from "@/lib/activity-tracker"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/local-storage"
import { cn } from "@/lib/utils"
import { LottieAnimation } from "@/components/ui/lottie-animation"

type FileEntry = {
  id: string
  name: string
  size: number
  type: string
  status: "queued" | "ocr" | "chunking" | "enriching" | "summarizing" | "complete" | "error"
  progress: number
  summary?: string
  urlsFound?: number
  ocrProvider?: string
  chunks?: number
  errorMessage?: string
  expandedSummary?: boolean
}

const stageLabels: Record<string, { label: string; icon: typeof FileText }> = {
  queued: { label: "Queued", icon: FileText },
  ocr: { label: "OCR Extraction", icon: ScanEye },
  chunking: { label: "Smart Chunking", icon: Scissors },
  enriching: { label: "URL Enrichment", icon: Link2 },
  summarizing: { label: "AI Summarization", icon: Loader2 },
  complete: { label: "Complete", icon: CheckCircle2 },
  error: { label: "Error", icon: X },
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadView() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [ocrProvider, setOcrProvider] = useState("auto")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (entry: FileEntry, file: File) => {
    // Stage 1: OCR
    setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "ocr", progress: 15 } : f))
    await new Promise((r) => setTimeout(r, 400))

    // Stage 2: Chunking
    setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "chunking", progress: 35 } : f))
    await new Promise((r) => setTimeout(r, 400))

    // Stage 3: Enriching
    setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "enriching", progress: 55 } : f))
    await new Promise((r) => setTimeout(r, 300))

    // Stage 4: AI Summarization via API
    setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "summarizing", progress: 75 } : f))

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/process", { method: "POST", body: formData })
      const data = await res.json()

      if (data.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "complete", progress: 100, summary: data.summary, urlsFound: data.urlsFound, chunks: data.chunks || 0 }
              : f
          )
        )

        // Track & save to library
        trackUpload(entry.name)
        const library = getItem<Array<{ id: string; name: string; type: string; size: number; summary: string; uploadedAt: string; chunks: number }>>(STORAGE_KEYS.LIBRARY, [])
        library.push({
          id: entry.id,
          name: entry.name,
          type: entry.type,
          size: entry.size,
          summary: data.summary || "",
          uploadedAt: new Date().toISOString(),
          chunks: data.chunks || 0,
        })
        setItem(STORAGE_KEYS.LIBRARY, library)
      } else {
        setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "error", progress: 0, errorMessage: data.error } : f))
      }
    } catch {
      setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "error", progress: 0, errorMessage: "Pipeline failed" } : f))
    }
  }, [])

  const addFiles = useCallback((newFiles: File[]) => {
    const entries: FileEntry[] = newFiles.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      type: f.type || "application/pdf",
      status: "queued" as const,
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...entries])
    entries.forEach((entry, i) => processFile(entry, newFiles[i]))
  }, [processFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length > 0) addFiles(dropped)
  }, [addFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) addFiles(selected)
    e.target.value = ""
  }, [addFiles])

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Upload & OCR</h1>
        <p className="mt-1 text-sm text-white/30">Multi-OCR document processing with intelligent chunking</p>
      </div>

      {/* OCR Provider selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-white/25">OCR Provider:</span>
        {[
          { value: "auto", label: "Auto (Best Available)" },
          { value: "deepseek", label: "DeepSeek OCR 2" },
          { value: "gemini", label: "Gemini 3 Flash" },
          { value: "mistral", label: "Mistral OCR" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setOcrProvider(p.value)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] transition-colors",
              ocrProvider === p.value
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                : "text-white/25 border border-white/[0.04] hover:text-white/50"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all",
          isDragging
            ? "border-blue-500/40 bg-blue-500/5"
            : "border-white/[0.08] bg-white/[0.01] hover:border-blue-500/20 hover:bg-white/[0.02]"
        )}
      >
        <LottieAnimation src="/animations/upload.json" style={{ width: 56, height: 56 }} />
        <div className="text-center">
          <p className="text-sm font-medium text-white/60">Drop files here or tap to browse</p>
          <p className="mt-1 text-xs text-white/20">PDF, TXT, DOCX, images — multi-OCR pipeline</p>
        </div>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.docx,.doc,.md,.png,.jpg,.jpeg,.tiff" onChange={handleFileInput} className="hidden" />
      </div>

      {/* Pipeline legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(stageLabels).map(([key, { label, icon: Icon }]) => (
          <div key={key} className="flex items-center gap-1.5 rounded-md bg-white/[0.02] px-2 py-1">
            <Icon className="h-3 w-3 text-white/20" />
            <span className="text-[10px] text-white/20">{label}</span>
          </div>
        ))}
      </div>

      {/* Files */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          {files.map((file) => (
            <GlassCard key={file.id} className={cn("p-4 animate-slide-up", !["queued", "complete", "error"].includes(file.status) && "border-blue-500/15")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", file.status === "complete" ? "bg-emerald-500/10" : file.status === "error" ? "bg-red-500/10" : "bg-blue-500/10")}>
                    <FileText className={cn("h-4 w-4", file.status === "complete" ? "text-emerald-400" : file.status === "error" ? "text-red-400" : "text-blue-400")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white/80">{file.name}</div>
                    <div className="text-xs text-white/25">{formatSize(file.size)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={file.status === "complete" ? "secondary" : file.status === "error" ? "destructive" : "outline"} className="shrink-0 gap-1 text-[10px]">
                    {!["complete", "queued", "error"].includes(file.status) && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                    {file.status === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
                    {stageLabels[file.status]?.label}
                  </Badge>
                  <button onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))} className="p-2 text-white/15 hover:text-white/40">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={file.progress} className="h-1.5 flex-1" />
                <span className="text-[10px] font-mono text-white/20 w-8 text-right">{file.progress}%</span>
              </div>
              {file.summary && file.summary.trim().length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-white/60">Summary</p>
                    {file.summary.length > 200 && (
                      <button
                        onClick={() => setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, expandedSummary: !f.expandedSummary } : f))}
                        className="text-[10px] text-blue-400/60 hover:text-blue-300 transition-colors"
                      >
                        {file.expandedSummary ? "Less" : "More"}
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-white/40 leading-relaxed">
                    <MarkdownContent text={file.expandedSummary || file.summary.length <= 200 ? file.summary : `${file.summary.slice(0, 200)}...`} />
                  </div>
                </div>
              )}
              {file.urlsFound !== undefined && (
                <div className="mt-2 flex items-center gap-1 text-xs text-white/20">
                  <Link2 className="h-3 w-3" /> {file.urlsFound} URLs found
                </div>
              )}
              {file.errorMessage && <div className="mt-2 text-xs text-red-400/70">{file.errorMessage}</div>}
            </GlassCard>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <GlassCard className="flex flex-col items-center justify-center py-12">
          <LottieAnimation src="/animations/document-scan.json" style={{ width: 80, height: 100 }} className="mb-4 opacity-50" />
          <p className="text-sm font-medium text-white/40">OCR → Chunk → Enrich → Summarize</p>
          <p className="mt-1 text-xs text-white/15 text-center max-w-xs">
            Multi-provider OCR with intelligent semantic chunking and graph indexing
          </p>
        </GlassCard>
      )}
    </div>
  )
}
