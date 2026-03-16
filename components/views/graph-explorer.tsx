"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Network, Search, FileText, MessageSquare, Upload, Loader2 } from "lucide-react"
import { getAllEvents, type ActivityEvent } from "@/lib/activity-tracker"
import { getItem, STORAGE_KEYS } from "@/lib/local-storage"
import { cn } from "@/lib/utils"
import { LottieAnimation } from "@/components/ui/lottie-animation"

/* ---------- types ---------- */
type NodeType = "center" | "category" | "search" | "document" | "chat"

interface GraphNode {
  id: string
  label: string
  type: NodeType
  x: number
  y: number
  meta?: Record<string, string>
}

interface GraphEdge {
  from: string
  to: string
}

/* ---------- color maps ---------- */
const nodeStyles: Record<NodeType, { bg: string; border: string; glow: string; text: string; fill: string }> = {
  center: { bg: "bg-blue-500/20", border: "border-blue-400/50", glow: "shadow-blue-500/40", text: "text-blue-200", fill: "rgba(96,165,250,0.5)" },
  category: { bg: "bg-purple-500/15", border: "border-purple-400/40", glow: "shadow-purple-500/30", text: "text-purple-200", fill: "rgba(168,85,247,0.4)" },
  search: { bg: "bg-cyan-500/15", border: "border-cyan-400/40", glow: "shadow-cyan-500/30", text: "text-cyan-200", fill: "rgba(34,211,238,0.4)" },
  document: { bg: "bg-emerald-500/15", border: "border-emerald-400/40", glow: "shadow-emerald-500/30", text: "text-emerald-200", fill: "rgba(52,211,153,0.4)" },
  chat: { bg: "bg-pink-500/15", border: "border-pink-400/40", glow: "shadow-pink-500/30", text: "text-pink-200", fill: "rgba(244,114,182,0.4)" },
}

/* ---------- graph builder ---------- */
const GRAPH_W = 1200
const GRAPH_H = 900
const CX = GRAPH_W / 2
const CY = GRAPH_H / 2

function buildActivityGraph(filter: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const events = getAllEvents()
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Center node
  nodes.push({ id: "you", label: "You", type: "center", x: CX, y: CY })

  // Category ring
  const categories = [
    { id: "cat-search", label: "Searches", type: "category" as NodeType, angle: -Math.PI / 2 },
    { id: "cat-doc", label: "Documents", type: "category" as NodeType, angle: Math.PI / 6 },
    { id: "cat-chat", label: "Chats", type: "category" as NodeType, angle: (5 * Math.PI) / 6 },
  ]

  const catRadius = 200
  categories.forEach((cat) => {
    nodes.push({
      id: cat.id,
      label: cat.label,
      type: cat.type,
      x: CX + Math.cos(cat.angle) * catRadius,
      y: CY + Math.sin(cat.angle) * catRadius,
    })
    edges.push({ from: "you", to: cat.id })
  })

  // Outer ring - actual items
  const searches = events.filter((e) => e.type === "search").slice(0, 8)
  const uploads = events.filter((e) => e.type === "upload").slice(0, 8)
  const chats = events.filter((e) => e.type === "chat").slice(0, 8)

  const addRing = (items: ActivityEvent[], parentId: string, nodeType: NodeType, baseAngle: number) => {
    const radius = 150
    items.forEach((item, i) => {
      if (filter !== "all" && filter !== nodeType) return
      const spread = Math.min(Math.PI * 0.8, items.length * 0.4)
      const angle = baseAngle + (i - (items.length - 1) / 2) * (spread / Math.max(items.length - 1, 1))
      const parent = nodes.find((n) => n.id === parentId)!
      nodes.push({
        id: item.id,
        label: item.title.length > 25 ? item.title.slice(0, 25) + "..." : item.title,
        type: nodeType,
        x: parent.x + Math.cos(angle) * radius,
        y: parent.y + Math.sin(angle) * radius,
        meta: { time: new Date(item.timestamp).toLocaleString() },
      })
      edges.push({ from: parentId, to: item.id })
    })
  }

  addRing(searches, "cat-search", "search", -Math.PI / 2)
  addRing(uploads, "cat-doc", "document", Math.PI / 6)
  addRing(chats, "cat-chat", "chat", (5 * Math.PI) / 6)

  return { nodes, edges }
}

/* ---------- component ---------- */
export function GraphExplorer() {
  const [filter, setFilter] = useState("all")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const [neo4jStatus, setNeo4jStatus] = useState<"checking" | "connected" | "disconnected">("checking")

  // Check Neo4j on mount
  useEffect(() => {
    fetch("/api/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "health" }),
    })
      .then((r) => r.json())
      .then((d) => setNeo4jStatus(d.connected ? "connected" : "disconnected"))
      .catch(() => setNeo4jStatus("disconnected"))
  }, [])

  const { nodes, edges } = useMemo(() => buildActivityGraph(filter), [filter])

  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const set = new Set<string>()
    edges.forEach((e) => {
      if (e.from === selectedNodeId || e.to === selectedNodeId) {
        set.add(`${e.from}__${e.to}`)
        set.add(e.from)
        set.add(e.to)
      }
    })
    return set
  }, [selectedNodeId, edges])

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-graph-node]")) return
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [pan])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return
    setPan({ x: panStart.current.panX + e.clientX - panStart.current.x, y: panStart.current.panY + e.clientY - panStart.current.y })
  }, [isPanning])

  const onPointerUp = useCallback(() => setIsPanning(false), [])

  const edgePath = (from: GraphNode, to: GraphNode) => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const cx = (from.x + to.x) / 2 + dy * 0.1
    const cy = (from.y + to.y) / 2 - dx * 0.1
    return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col md:flex-row gap-4">
      {/* Controls */}
      <GlassCard className="w-full md:w-72 shrink-0 p-4 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Knowledge Graph</h2>
          <p className="text-xs text-white/30 mt-0.5">Obsidian-style activity map</p>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={cn("h-2 w-2 rounded-full", neo4jStatus === "connected" ? "bg-emerald-400" : neo4jStatus === "checking" ? "bg-blue-400 animate-pulse" : "bg-white/15")} />
          <span className="text-[10px] text-white/30">Neo4j {neo4jStatus}</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/30 mb-1.5">Filter</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: "all", label: "All" },
              { value: "search", label: "Searches" },
              { value: "document", label: "Documents" },
              { value: "chat", label: "Chats" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setSelectedNodeId(null) }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] transition-colors",
                  filter === f.value ? "bg-blue-500/15 text-blue-300 border border-blue-500/20" : "text-white/25 hover:text-white/50 border border-white/[0.04]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {selectedNode && (
          <div className="border-t border-white/[0.06] pt-3">
            <h4 className="text-[11px] font-medium text-white/40 mb-2">Selected</h4>
            <div className={cn("p-3 rounded-lg border", nodeStyles[selectedNode.type].bg, nodeStyles[selectedNode.type].border)}>
              <p className={cn("text-sm font-medium", nodeStyles[selectedNode.type].text)}>{selectedNode.label}</p>
              <p className="text-[10px] text-white/30 mt-1 capitalize">{selectedNode.type}</p>
              {selectedNode.meta?.time && <p className="text-[10px] text-white/20 mt-0.5">{selectedNode.meta.time}</p>}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-auto border-t border-white/[0.06] pt-3">
          <h4 className="text-[10px] font-medium text-white/25 mb-2">Legend</h4>
          <div className="space-y-1.5 text-[10px]">
            {[
              { color: "bg-blue-400/50", label: "You (center)" },
              { color: "bg-purple-400/50", label: "Category" },
              { color: "bg-cyan-400/50", label: "Search" },
              { color: "bg-emerald-400/50", label: "Document" },
              { color: "bg-pink-400/50", label: "Chat" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", l.color)} />
                <span className="text-white/25">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Graph canvas */}
      <GlassCard className="flex-1 p-0 min-h-[500px] overflow-hidden relative">
        {nodes.length <= 4 && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center">
              <LottieAnimation src="/animations/network-nodes.json" style={{ width: 100, height: 100 }} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm text-white/25">No activity yet</p>
              <p className="text-xs text-white/15 mt-1">Search, upload, or chat to populate the graph</p>
            </div>
          </div>
        )}
        <div
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          style={{ background: "rgb(2,6,23)", backgroundImage: "radial-gradient(rgba(148,163,184,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="relative" style={{ width: GRAPH_W, height: GRAPH_H, transform: `translate(${pan.x}px, ${pan.y}px)`, transition: isPanning ? "none" : "transform 0.15s ease-out" }}>
            <svg className="absolute inset-0 pointer-events-none" width={GRAPH_W} height={GRAPH_H} viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}>
              <defs><style>{`@keyframes dash-flow { to { stroke-dashoffset: -40; } }`}</style></defs>
              {edges.map((edge, i) => {
                const from = nodes.find((n) => n.id === edge.from)
                const to = nodes.find((n) => n.id === edge.to)
                if (!from || !to) return null
                const key = `${edge.from}__${edge.to}`
                const highlighted = connectedEdges.has(key)
                const dimmed = selectedNodeId !== null && !highlighted

                return (
                  <path
                    key={i}
                    d={edgePath(from, to)}
                    fill="none"
                    stroke={highlighted ? nodeStyles[to.type].fill : dimmed ? "rgba(100,116,139,0.05)" : "rgba(148,163,184,0.08)"}
                    strokeWidth={highlighted ? 2 : 1}
                    strokeDasharray={highlighted ? "none" : "4 4"}
                    style={!highlighted && !dimmed ? { animation: "dash-flow 3s linear infinite" } : undefined}
                  />
                )
              })}
            </svg>

            {nodes.map((node) => {
              const s = nodeStyles[node.type]
              const isSelected = selectedNodeId === node.id
              const isConnected = connectedEdges.has(node.id)
              const isDimmed = selectedNodeId !== null && !isSelected && !isConnected
              const isCenter = node.type === "center"
              const isCat = node.type === "category"
              const w = isCenter ? 80 : isCat ? 100 : 120
              const h = isCenter ? 80 : isCat ? 40 : 34

              return (
                <div
                  key={node.id}
                  data-graph-node
                  className={cn(
                    "absolute flex items-center justify-center border backdrop-blur-md cursor-pointer transition-all duration-200",
                    isCenter ? "rounded-full" : "rounded-xl",
                    s.bg, s.border,
                    isSelected && `shadow-xl ${s.glow} ring-1 ring-white/20`,
                    isDimmed && "opacity-15",
                  )}
                  style={{ width: w, height: h, left: node.x - w / 2, top: node.y - h / 2 }}
                  onClick={(e) => { e.stopPropagation(); setSelectedNodeId(selectedNodeId === node.id ? null : node.id) }}
                  onPointerEnter={() => setHoveredNodeId(node.id)}
                  onPointerLeave={() => setHoveredNodeId(null)}
                >
                  <span className={cn("text-center px-2 truncate", s.text, isCenter ? "text-xs font-bold" : isCat ? "text-[11px] font-semibold" : "text-[10px]")}>
                    {node.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
