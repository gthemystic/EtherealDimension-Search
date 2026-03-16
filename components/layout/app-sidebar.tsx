"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  LayoutDashboard,
  Upload,
  Network,
  Clock,
  Library,
  Settings,
  MessageSquare,
  Github,
  X,
  FileSearch,
  Workflow,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Search", icon: Search },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload & OCR", icon: Upload },
  { href: "/graph", label: "Knowledge Graph", icon: Network },
  { href: "/github", label: "GitHub", icon: Github },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/library", label: "Library", icon: Library },
  { href: "/pipeline", label: "Pipeline", icon: Workflow },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <FileSearch className="h-4.5 w-4.5 text-blue-300" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                EthD Search
              </h1>
              <p className="text-[9px] font-medium tracking-wider uppercase text-white/30">Multi-Agent RAG</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-blue-500/15 to-purple-500/15 text-white border border-blue-500/20 shadow-lg shadow-blue-500/5"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-blue-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Infrastructure status */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/30">Neo4j</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-white/30">n8n</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-white/30">Redis</span>
            </div>
          </div>
          <p className="text-[9px] text-white/20 mt-1.5">Multi-Agent RAG Pipeline</p>
        </div>
      </aside>
    </>
  )
}
