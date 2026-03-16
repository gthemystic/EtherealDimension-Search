"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  MessageSquare,
  Upload,
  Network,
  Library,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  { href: "/", label: "Search", icon: Search },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/library", label: "Library", icon: Library },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-white/[0.06] bg-slate-950/95 backdrop-blur-xl">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors",
              isActive ? "text-blue-400" : "text-white/30"
            )}
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
