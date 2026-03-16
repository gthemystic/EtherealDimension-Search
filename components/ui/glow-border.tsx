"use client"

import { cn } from "@/lib/utils"

export function GlowBorder({
  children,
  className,
  glowColor = "from-blue-500 via-purple-500 to-pink-500",
}: {
  children: React.ReactNode
  className?: string
  glowColor?: string
}) {
  return (
    <div className={cn("relative group", className)}>
      <div className={cn(
        "absolute -inset-[1px] rounded-2xl bg-gradient-to-r opacity-20 blur-sm transition-opacity duration-500 group-hover:opacity-40",
        glowColor
      )} />
      <div className="relative">
        {children}
      </div>
    </div>
  )
}
