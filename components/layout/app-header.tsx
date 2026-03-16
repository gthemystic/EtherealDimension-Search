"use client"

import { usePathname } from "next/navigation"
import { Menu, Command } from "lucide-react"

const pageTitles: Record<string, string> = {
  "/": "Search",
  "/chat": "Chat",
  "/dashboard": "Dashboard",
  "/upload": "Upload & OCR",
  "/graph": "Knowledge Graph",
  "/github": "GitHub",
  "/timeline": "Timeline",
  "/library": "Library",
  "/pipeline": "Pipeline",
  "/settings": "Settings",
}

export function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "Search"
  const isHome = pathname === "/"

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-slate-950/40 backdrop-blur-md z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        {!isHome && (
          <h1 className="text-sm font-medium text-white/70">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/25 text-xs">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>
      </div>
    </header>
  )
}
