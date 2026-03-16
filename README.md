# Ethereal Dimension Search

Multi-agent RAG search platform for engineering documents. Built with Next.js 16, Perplexity sonar-pro, Groq, Neo4j, and n8n orchestration.

## Features

- **AI-Powered Search** — Perplexity sonar-pro with SSE streaming and citation extraction
- **Chat** — Groq-powered engineering assistant (Llama 3.3 70B)
- **Knowledge Graph** — Neo4j document graph with entity extraction and relationship mapping
- **GitHub Code Search** — Search code and repos across structural engineering projects
- **Multi-OCR Pipeline** — DeepSeek OCR 2, Gemini 3 Flash, Mistral OCR with ensemble mode
- **Document Processing** — PDF text extraction, URL enrichment via Firecrawl, AI summarization
- **Lottie Animations** — 10 custom animations for loading, empty, success, and error states
- **Feature Flags** — Smart mock system with auto-fallback when API keys are missing
- **Demo Mode** — Pre-seeded with 18 activity events, 6 documents, and realistic engineering mock data

## Quick Start

```bash
# Install dependencies
pnpm install

# Run in demo mode (no API keys needed)
pnpm dev

# Run with live APIs
# Edit .env.local with your API keys, set NEXT_PUBLIC_MOCK_MODE=false
pnpm dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

| Variable | Service | Required for |
|---|---|---|
| `NEXT_PUBLIC_MOCK_MODE` | Feature flag | Set `true` for demo, `false` for live |
| `PERPLEXITY_API_KEY` | Perplexity | Search |
| `GROQ_API_KEY` | Groq | Chat, document processing |
| `GITHUB_PAT_TOKEN` | GitHub | Code search |
| `FIRECRAWL_API_KEY` | Firecrawl | Web scraping, URL enrichment |
| `OPENAI_API_KEY` | OpenAI | Future integrations |
| `NEO4J_URI` | Neo4j | Knowledge graph |
| `DEEPSEEK_API_KEY` | DeepSeek | OCR (optional) |
| `GEMINI_API_KEY` | Google | OCR (optional) |
| `MISTRAL_API_KEY` | Mistral | OCR (optional) |

## Feature Flag System

The app degrades gracefully when API keys are missing:

- **Global mock**: `NEXT_PUBLIC_MOCK_MODE=true` mocks everything
- **Per-service override**: `MOCK_SEARCH=true`, `MOCK_CHAT=true`, etc.
- **Smart fallback**: If a required API key is missing, that service auto-mocks even with global mock off

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: Tailwind CSS, Radix UI, shadcn/ui, Framer Motion
- **Animations**: Lottie (lottie-react)
- **Charts**: Recharts
- **Search**: Perplexity API (sonar-pro)
- **LLM**: Groq (Llama 3.3 70B)
- **Graph DB**: Neo4j
- **Orchestration**: n8n workflows
- **OCR**: DeepSeek, Gemini, Mistral (multi-provider)
- **Web Scraping**: Firecrawl
- **Code Search**: GitHub API (Octokit)

## Project Structure

```
app/
  api/          # 7 API routes (search, chat, graph, github, crawl, process, ocr)
  dashboard/    # Activity dashboard with charts
  chat/         # Groq-powered AI chat
  github/       # GitHub code + repo search
  graph/        # Neo4j knowledge graph explorer
  library/      # Document library
  pipeline/     # Pipeline architecture view
  settings/     # Configuration + demo mode indicator
  timeline/     # Activity timeline with slider
  upload/       # Multi-OCR upload pipeline
components/
  layout/       # App shell, sidebar, header, mobile nav
  views/        # Page-level view components
  shared/       # Reusable components (markdown, confidence bar, etc.)
  ui/           # Base UI components (button, card, lottie, etc.)
lib/
  feature-flags.ts    # Smart mock/live flag system
  mocks/              # 7 mock data modules
  activity-tracker.ts # localStorage activity tracking
  animations.ts       # Lottie animation registry
  perplexity.ts       # Perplexity API client
  groq.ts             # Groq API client
  neo4j.ts            # Neo4j driver
  github.ts           # GitHub Octokit wrapper
  firecrawl.ts        # Firecrawl client
  ocr-pipeline.ts     # Multi-provider OCR
public/
  animations/   # 10 Lottie JSON animation files
scripts/
  seed-neo4j.ts # Graph database seed script
```

## License

MIT
