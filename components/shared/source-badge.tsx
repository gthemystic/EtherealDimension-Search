import { FileText, Eye, Link2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type Source = {
  type: "page" | "diagram" | "external" | "table"
  label: string
  url?: string
}

export function SourceBadge({ source }: { source: Source }) {
  const iconMap = {
    page: FileText,
    diagram: Eye,
    external: Link2,
    table: FileText,
  }
  const colorMap = {
    page: "border-primary/30 text-primary",
    diagram: "border-chart-2/40 text-chart-2",
    external: "border-blue-500/30 text-blue-400",
    table: "border-chart-4/40 text-chart-4",
  }
  const Icon = iconMap[source.type]

  if (source.url) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex"
      >
        <Badge
          variant="outline"
          className={cn(
            "gap-1 text-[10px] cursor-pointer hover:bg-blue-500/10 transition-colors",
            colorMap[source.type]
          )}
        >
          <Icon className="h-2.5 w-2.5" />
          {source.label}
          <ExternalLink className="h-2 w-2 opacity-50" />
        </Badge>
      </a>
    )
  }

  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px]", colorMap[source.type])}>
      <Icon className="h-2.5 w-2.5" />
      {source.label}
    </Badge>
  )
}
