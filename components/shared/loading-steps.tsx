"use client"

import { useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { LottieAnimation } from "@/components/ui/lottie-animation"

const agentSteps = [
  "Connecting to search engine...",
  "Searching knowledge base...",
  "Analyzing cross-references...",
  "Scoring confidence...",
  "Generating response...",
]

export function LoadingSteps() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < agentSteps.length - 1 ? prev + 1 : prev))
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-2">
      {agentSteps.map((s, i) => (
        <div
          key={s}
          className={cn(
            "flex items-center gap-2 text-xs transition-opacity duration-300",
            i <= step ? "opacity-100" : "opacity-30"
          )}
        >
          {i < step ? (
            <LottieAnimation src="/animations/success.json" loop={false} style={{ width: 16, height: 16 }} fallback={<Check className="h-3 w-3 text-success" />} />
          ) : i === step ? (
            <LottieAnimation src="/animations/search-pulse.json" style={{ width: 16, height: 16 }} fallback={<Loader2 className="h-3 w-3 animate-spin text-primary" />} />
          ) : (
            <div className="h-3 w-3 rounded-full border border-border" />
          )}
          <span className={cn(i <= step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
        </div>
      ))}
    </div>
  )
}
