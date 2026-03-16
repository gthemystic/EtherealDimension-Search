"use client"

import { useState } from "react"
import { Search, Star, GitFork, Code2, ExternalLink, Loader2, FolderGit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlassCard } from "@/components/shared/glass-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LottieAnimation } from "@/components/ui/lottie-animation"

type CodeResult = {
  name: string
  path: string
  repository: string
  url: string
  score: number
}

type RepoResult = {
  name: string
  description: string | null
  stars: number
  language: string | null
  url: string
  updatedAt: string
}

export function GithubView() {
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState("code")
  const [codeResults, setCodeResults] = useState<CodeResult[]>([])
  const [repoResults, setRepoResults] = useState<RepoResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsLoading(true)
    setError("")

    try {
      const action = tab === "code" ? "searchCode" : "searchRepos"
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, query }),
      })

      const data = await res.json()

      if (data.success) {
        if (tab === "code") {
          setCodeResults(data.results)
        } else {
          setRepoResults(data.results)
        }
        setTotalCount(data.totalCount)
      } else {
        setError(data.error || "Search failed")
      }
    } catch {
      setError("Failed to connect to GitHub API")
    } finally {
      setIsLoading(false)
    }
  }

  const langColors: Record<string, string> = {
    TypeScript: "bg-blue-500",
    JavaScript: "bg-yellow-500",
    Python: "bg-green-500",
    Rust: "bg-orange-500",
    Go: "bg-cyan-500",
    Swift: "bg-orange-400",
    Java: "bg-red-500",
    "C++": "bg-pink-500",
    "C#": "bg-violet-500",
    C: "bg-gray-500",
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">GitHub Explorer</h1>
        <p className="mt-1 text-sm text-white/30">Search code and repositories across GitHub</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/[0.03] border border-white/[0.06]">
          <TabsTrigger value="code" className="gap-1.5 data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-300">
            <Code2 className="h-3.5 w-3.5" />
            Search Code
          </TabsTrigger>
          <TabsTrigger value="repos" className="gap-1.5 data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-300">
            <FolderGit2 className="h-3.5 w-3.5" />
            Search Repos
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/15" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
            placeholder={tab === "code" ? "Search code (e.g. ASCE 7 wind load)" : "Search repositories..."}
            className="w-full min-h-[44px] rounded-xl border border-white/[0.06] bg-white/[0.02] pl-10 pr-24 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-colors"
          />
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white hover:bg-blue-500 rounded-lg"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
          </Button>
        </div>

        {error && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {error}
          </div>
        )}

        {totalCount !== null && (
          <p className="mt-3 text-xs text-white/20">{totalCount.toLocaleString()} results found</p>
        )}

        <TabsContent value="code" className="mt-4 space-y-2">
          {codeResults.map((result, i) => (
            <a
              key={i}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <GlassCard className="p-3 hover:border-blue-500/30 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Code2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span className="text-sm font-medium text-white/80 truncate group-hover:text-blue-300 transition-colors">
                        {result.name}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 truncate">{result.path}</p>
                    <p className="text-[11px] text-white/20 mt-1">{result.repository}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-white/10 group-hover:text-blue-400 transition-colors shrink-0" />
                </div>
              </GlassCard>
            </a>
          ))}
          {codeResults.length === 0 && !isLoading && totalCount === null && (
            <div className="flex flex-col items-center py-16 text-center">
              <LottieAnimation src="/animations/empty-search.json" style={{ width: 100, height: 100 }} className="mb-2 opacity-40" />
              <p className="text-sm text-white/30">Search for code across GitHub</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="repos" className="mt-4 space-y-2">
          {repoResults.map((result, i) => (
            <a
              key={i}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <GlassCard className="p-4 hover:border-purple-500/30 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderGit2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                      <span className="text-sm font-medium text-white/80 truncate group-hover:text-purple-300 transition-colors">
                        {result.name}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-xs text-white/40 line-clamp-2 mt-1">{result.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {result.language && (
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-2 w-2 rounded-full", langColors[result.language] || "bg-gray-400")} />
                          <span className="text-[11px] text-white/30">{result.language}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500/50" />
                        <span className="text-[11px] text-white/30">{result.stars.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-white/10 group-hover:text-purple-400 transition-colors shrink-0" />
                </div>
              </GlassCard>
            </a>
          ))}
          {repoResults.length === 0 && !isLoading && totalCount === null && (
            <div className="flex flex-col items-center py-16 text-center">
              <LottieAnimation src="/animations/network-nodes.json" style={{ width: 100, height: 100 }} className="mb-2 opacity-40" />
              <p className="text-sm text-white/30">Search for repositories</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
