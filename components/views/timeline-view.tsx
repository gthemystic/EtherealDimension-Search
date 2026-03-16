"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { GlassCard } from "@/components/shared/glass-card"
import { Search, Upload, MessageSquare, Activity } from "lucide-react"
import { getAllEvents, type ActivityEvent } from "@/lib/activity-tracker"
import { cn } from "@/lib/utils"
import { LottieAnimation } from "@/components/ui/lottie-animation"

export function TimelineView() {
  const [filter, setFilter] = useState("all")
  const [position, setPosition] = useState([100])
  const [events, setEvents] = useState<ActivityEvent[]>([])

  useEffect(() => {
    setEvents(getAllEvents())
  }, [])

  const filtered = filter === "all"
    ? events
    : events.filter((e) => e.type === filter)

  const eventIndex = filtered.length > 0
    ? Math.min(Math.floor((position[0] / 100) * filtered.length), filtered.length - 1)
    : 0

  const current = filtered[eventIndex]

  const typeIcon = (type: string) => {
    switch (type) {
      case "search": return <Search className="h-5 w-5 text-blue-400" />
      case "upload": return <Upload className="h-5 w-5 text-purple-400" />
      case "chat": return <MessageSquare className="h-5 w-5 text-emerald-400" />
      default: return <Activity className="h-5 w-5 text-white/30" />
    }
  }

  const typeEmoji = (type: string) => {
    switch (type) {
      case "search": return "🔍"
      case "upload": return "📄"
      case "chat": return "💬"
      default: return "⚡"
    }
  }

  if (events.length === 0) {
    return (
      <div className="p-4 md:p-6 h-full flex flex-col items-center justify-center">
        <LottieAnimation src="/animations/empty-search.json" style={{ width: 120, height: 120 }} className="mb-2 opacity-50" />
        <h2 className="text-lg font-semibold text-white/30">No Activity Yet</h2>
        <p className="text-sm text-white/15 mt-1">Search, upload, or chat to start building your timeline</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Activity Timeline
        </h1>
        <div className="flex items-center gap-2 mt-3">
          {[
            { value: "all", label: "All" },
            { value: "search", label: "Searches" },
            { value: "upload", label: "Uploads" },
            { value: "chat", label: "Chats" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPosition([0]) }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs transition-colors",
                filter === f.value
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                  : "text-white/25 hover:text-white/50 border border-white/[0.04]"
              )}
            >
              {f.label}
              <span className="ml-1.5 text-white/15">
                {f.value === "all" ? events.length : events.filter((e) => e.type === f.value).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Event Card */}
      <div className="flex-1 flex items-center justify-center">
        {current ? (
          <GlassCard className="max-w-3xl w-full p-6 md:p-8 transition-all duration-300">
            <div key={eventIndex} className="flex items-start gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-4xl md:text-5xl shrink-0">{typeEmoji(current.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {typeIcon(current.type)}
                  <span className="text-[11px] text-white/25 uppercase tracking-wider">{current.type}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white/90 mb-2">{current.title}</h2>
                <p className="text-sm text-white/30">
                  {new Date(current.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <p className="text-sm text-white/20">No events match this filter</p>
        )}
      </div>

      {/* Timeline Slider */}
      <GlassCard className="p-6">
        <div className="relative mb-6">
          <div className="flex justify-between px-2">
            {filtered.slice(0, Math.min(filtered.length, 10)).map((event, index) => {
              const pos = filtered.length > 1 ? (index / (Math.min(filtered.length, 10) - 1)) * 100 : 0
              return (
                <button
                  key={event.id}
                  onClick={() => setPosition([pos])}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className={`text-xl mb-1 transition-all ${index === eventIndex ? "scale-125" : "opacity-40 group-hover:opacity-70"}`}>
                    {typeEmoji(event.type)}
                  </div>
                  <div className={`text-[9px] transition-colors ${index === eventIndex ? "text-blue-400 font-semibold" : "text-white/20"}`}>
                    {new Date(event.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-2">
          <Slider value={position} onValueChange={setPosition} max={100} step={1} className="w-full" />
        </div>

        <div className="flex justify-between mt-3 text-[10px] text-white/15 px-2">
          <span>{filtered.length > 0 ? new Date(filtered[filtered.length - 1].timestamp).toLocaleDateString() : ""}</span>
          <span>{filtered.length} events</span>
          <span>{filtered.length > 0 ? new Date(filtered[0].timestamp).toLocaleDateString() : ""}</span>
        </div>
      </GlassCard>
    </div>
  )
}
