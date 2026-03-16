"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Search,
  Grid3x3,
  List,
  Trash2,
  Upload,
  ExternalLink,
  BookOpen,
  Hash,
  Link2,
  Eye,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { MarkdownContent } from "@/components/shared/markdown-content"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/local-storage"
import { cn } from "@/lib/utils"
import { LottieAnimation } from "@/components/ui/lottie-animation"
import Link from "next/link"

type LibraryDoc = {
  id: string
  name: string
  type: string
  size: number
  summary: string
  uploadedAt: string
  chunks: number
  pages?: number
  urlsEnriched?: number
  visionAnalyses?: number
  status?: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function LibraryView() {
  const [docs, setDocs] = useState<LibraryDoc[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [searchFilter, setSearchFilter] = useState("")
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)

  useEffect(() => {
    setDocs(getItem<LibraryDoc[]>(STORAGE_KEYS.LIBRARY, []).reverse())
  }, [])

  const removeDoc = (id: string) => {
    const updated = docs.filter((d) => d.id !== id)
    setDocs(updated)
    setItem(STORAGE_KEYS.LIBRARY, updated)
    if (selectedDoc === id) setSelectedDoc(null)
  }

  const filtered = docs.filter((d) =>
    d.name.toLowerCase().includes(searchFilter.toLowerCase())
  )

  if (docs.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Document Library</h1>
          <p className="mt-1 text-sm text-white/30">Your processed documents</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24">
          <LottieAnimation src="/animations/empty-docs.json" style={{ width: 120, height: 120 }} className="mb-2 opacity-50" />
          <p className="text-sm text-white/30">No documents yet</p>
          <p className="text-xs text-white/15 mt-1 mb-4">Upload documents to see them here</p>
          <Link href="/upload">
            <Button variant="outline" size="sm" className="gap-2 border-white/[0.08] text-white/40">
              <Upload className="h-3.5 w-3.5" />
              Go to Upload
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6 overflow-y-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Document Library</h1>
          <p className="mt-1 text-sm text-white/30">{docs.length} documents processed</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")} className="min-h-[40px] min-w-[40px]">
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")} className="min-h-[40px] min-w-[40px]">
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/15" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter documents..."
          className="w-full min-h-[44px] rounded-xl border border-white/[0.06] bg-white/[0.02] pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-colors"
        />
      </div>

      {viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          {filtered.map((doc) => (
            <GlassCard
              key={doc.id}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                selectedDoc === doc.id ? "border-blue-500/30 bg-blue-500/5" : "hover:border-white/10"
              )}
              onClick={() => setSelectedDoc(selectedDoc === doc.id ? null : doc.id)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
                <FileText className="h-4 w-4 text-white/30" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="truncate text-sm font-medium text-white/70 block">{doc.name}</span>
                <div className="flex items-center gap-3 text-xs text-white/20 mt-0.5">
                  <span>{formatSize(doc.size)}</span>
                  {doc.chunks > 0 && <span>{doc.chunks} chunks</span>}
                  <span>{timeAgo(doc.uploadedAt)}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeDoc(doc.id) }}
                className="p-2 text-white/10 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((doc) => (
            <GlassCard
              key={doc.id}
              className={cn(
                "p-4 cursor-pointer transition-all",
                selectedDoc === doc.id ? "border-blue-500/30 bg-blue-500/5" : "hover:border-white/10"
              )}
              onClick={() => setSelectedDoc(selectedDoc === doc.id ? null : doc.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <FileText className="h-4 w-4 text-blue-400" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeDoc(doc.id) }}
                  className="p-1.5 text-white/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-3">
                <span className="text-sm font-medium text-white/70 line-clamp-1">{doc.name}</span>
                <div className="mt-1 text-xs text-white/20">{formatSize(doc.size)} • {timeAgo(doc.uploadedAt)}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedDoc && (() => {
        const doc = filtered.find((d) => d.id === selectedDoc)
        if (!doc) return null
        const isPdf = doc.name.toLowerCase().endsWith('.pdf')
        return (
          <GlassCard className="border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between p-4 pb-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <FileText className="h-4 w-4 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white/80 truncate">{doc.name}</h3>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} • {formatSize(doc.size)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)} className="text-xs text-white/30 shrink-0">Close</Button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
              {doc.pages && (
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <BookOpen className="h-3 w-3" />
                  <span>{doc.pages} pages</span>
                </div>
              )}
              {doc.chunks > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <Hash className="h-3 w-3" />
                  <span>{doc.chunks} chunks</span>
                </div>
              )}
              {doc.urlsEnriched !== undefined && doc.urlsEnriched > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <Link2 className="h-3 w-3" />
                  <span>{doc.urlsEnriched} URLs enriched</span>
                </div>
              )}
              {doc.visionAnalyses !== undefined && doc.visionAnalyses > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <Eye className="h-3 w-3" />
                  <span>{doc.visionAnalyses} vision analyses</span>
                </div>
              )}
              {doc.status && (
                <Badge variant="secondary" className="text-[10px] ml-auto">{doc.status}</Badge>
              )}
            </div>

            {/* PDF Preview */}
            {isPdf && (
              <div className="border-b border-white/[0.04]">
                <iframe
                  src={`/api/pdf-preview?name=${encodeURIComponent(doc.name)}`}
                  className="w-full h-[400px] bg-white/[0.02]"
                  title={`Preview: ${doc.name}`}
                  onError={(e) => { (e.target as HTMLIFrameElement).style.display = 'none' }}
                />
                <div className="flex items-center justify-center py-6 text-center bg-white/[0.01]">
                  <div>
                    <FileText className="h-8 w-8 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/20">PDF preview available when document is uploaded</p>
                    <p className="text-[10px] text-white/10 mt-1">Upload the actual file to enable inline rendering</p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            {doc.summary && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="h-3 w-3 text-blue-400" />
                  <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">AI Summary</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-white/50 leading-relaxed">
                  <MarkdownContent text={doc.summary} />
                </div>
              </div>
            )}
          </GlassCard>
        )
      })()}
    </div>
  )
}
