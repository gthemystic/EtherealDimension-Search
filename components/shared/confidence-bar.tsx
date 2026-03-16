import { cn } from "@/lib/utils"

export function ConfidenceBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            percentage >= 80
              ? "bg-success"
              : percentage >= 60
              ? "bg-warning"
              : "bg-destructive"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground">{percentage}%</span>
    </div>
  )
}
