import { cn } from "@/lib/utils"

export function GlassCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
