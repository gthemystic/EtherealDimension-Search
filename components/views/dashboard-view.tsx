"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Upload,
  MessageSquare,
  Network,
  ArrowUpRight,
  Activity,
} from "lucide-react"
import { Area, AreaChart, XAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { GlassCard } from "@/components/shared/glass-card"
import { getStats, getDailyActivity, type ActivityStats, type DailyActivity } from "@/lib/activity-tracker"
import Link from "next/link"

export function DashboardView() {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [dailyData, setDailyData] = useState<DailyActivity[]>([])

  useEffect(() => {
    setStats(getStats())
    setDailyData(getDailyActivity(7))
  }, [])

  const statCards = [
    { label: "Searches", value: stats?.totalSearches || 0, icon: Search, href: "/", color: "text-blue-400" },
    { label: "Uploads", value: stats?.totalUploads || 0, icon: Upload, href: "/upload", color: "text-purple-400" },
    { label: "Chats", value: stats?.totalChats || 0, icon: MessageSquare, href: "/chat", color: "text-emerald-400" },
    { label: "Total Activity", value: (stats?.totalSearches || 0) + (stats?.totalUploads || 0) + (stats?.totalChats || 0), icon: Activity, href: "/pipeline", color: "text-pink-400" },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-white/30">Your engineering search pipeline at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <GlassCard className="p-4 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03]">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <ArrowUpRight className="h-3 w-3 text-white/10 group-hover:text-white/30 transition-colors" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold text-white">{stat.value}</div>
                <div className="text-xs text-white/30">{stat.label}</div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Activity Chart */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-1">Activity This Week</h3>
        <p className="text-xs text-white/20 mb-4">Searches, uploads, and chats</p>
        <div className="h-[200px] w-full">
          {dailyData.some((d) => d.Searches + d.Uploads + d.Chats > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSearches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(270 70% 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(270 70% 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillChats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160 60% 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160 60% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "rgba(2,6,23,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", color: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                <Area dataKey="Chats" type="monotone" fill="url(#fillChats)" stroke="hsl(160 60% 50%)" strokeWidth={1.5} />
                <Area dataKey="Uploads" type="monotone" fill="url(#fillUploads)" stroke="hsl(270 70% 60%)" strokeWidth={1.5} />
                <Area dataKey="Searches" type="monotone" fill="url(#fillSearches)" stroke="hsl(217 91% 60%)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-white/15">
              Start searching to see activity data
            </div>
          )}
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { label: "Search Documents", href: "/", icon: Search, desc: "AI-powered engineering search" },
            { label: "Upload & Process", href: "/upload", icon: Upload, desc: "OCR + chunking pipeline" },
            { label: "Chat with AI", href: "/chat", icon: MessageSquare, desc: "Groq-powered conversation" },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer">
                <action.icon className="h-4 w-4 text-blue-400/60" />
                <div>
                  <p className="text-xs font-medium text-white/60">{action.label}</p>
                  <p className="text-[10px] text-white/20">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </GlassCard>

      {/* Recent Activity */}
      {stats && (stats.recentSearches.length > 0 || stats.recentUploads.length > 0) && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-white/60 mb-3">Recent Activity</h3>
          <div className="space-y-1.5">
            {[...stats.recentSearches, ...stats.recentUploads, ...stats.recentChats]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 8)
              .map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.01]">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    event.type === "search" ? "bg-blue-400" : event.type === "upload" ? "bg-purple-400" : "bg-emerald-400"
                  }`} />
                  <span className="text-xs text-white/40 truncate flex-1">{event.title}</span>
                  <span className="text-[10px] text-white/15 shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
