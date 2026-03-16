"use client"

import { cn } from "@/lib/utils"

export interface AgentStep {
  name: string
  status: "idle" | "running" | "complete" | "error"
  durationMs?: number
}

export function AgentStatus({ agents }: { agents: AgentStep[] }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {agents.map((agent, i) => (
        <div key={agent.name} className="flex items-center gap-1.5">
          {i > 0 && (
            <div className={cn(
              "w-4 h-px",
              agent.status === "complete" ? "bg-emerald-500/40" : "bg-white/10"
            )} />
          )}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border transition-all",
              agent.status === "idle" && "border-white/10 text-white/30 bg-white/[0.02]",
              agent.status === "running" && "border-blue-500/40 text-blue-300 bg-blue-500/10 animate-pulse",
              agent.status === "complete" && "border-emerald-500/30 text-emerald-300 bg-emerald-500/10",
              agent.status === "error" && "border-red-500/30 text-red-300 bg-red-500/10",
            )}
          >
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              agent.status === "idle" && "bg-white/20",
              agent.status === "running" && "bg-blue-400 animate-ping",
              agent.status === "complete" && "bg-emerald-400",
              agent.status === "error" && "bg-red-400",
            )} />
            {agent.name}
            {agent.durationMs !== undefined && agent.status === "complete" && (
              <span className="text-white/30">{agent.durationMs}ms</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
