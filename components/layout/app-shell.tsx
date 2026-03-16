"use client"

import { useState, useEffect, useCallback } from "react"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { MobileNav } from "./mobile-nav"
import { seedDemoData } from "@/lib/mocks/demo-seed"
import { seedLibraryData } from "@/lib/mocks/documents"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Seed demo data on mount
  useEffect(() => {
    seedDemoData()
    seedLibraryData()
  }, [])

  // Cmd+K to focus search, Cmd+B to toggle sidebar
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent("ethd:focus-search"))
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault()
      setSidebarOpen((prev) => !prev)
    }
    if (e.key === "Escape") {
      setSidebarOpen(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex h-screen bg-[#030711] overflow-hidden">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
