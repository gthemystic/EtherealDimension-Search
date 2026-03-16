/**
 * Intelligent Document Chunking
 * Inspired by Chonkie - semantic-aware chunking that respects document structure
 */

export interface Chunk {
  id: string
  content: string
  index: number
  tokens: number
  type: 'heading' | 'paragraph' | 'table' | 'code' | 'list' | 'equation'
  metadata: {
    headingContext?: string
    pageNumber?: number
    startLine: number
    endLine: number
  }
}

export interface ChunkingOptions {
  maxTokens?: number       // Max tokens per chunk (default 512)
  overlap?: number          // Overlap tokens between chunks (default 64)
  respectBoundaries?: boolean // Don't split mid-sentence (default true)
}

// Simple token estimation (4 chars ≈ 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function detectBlockType(text: string): Chunk['type'] {
  const trimmed = text.trim()
  if (/^#{1,6}\s/.test(trimmed)) return 'heading'
  if (/^\|.*\|/.test(trimmed) && trimmed.includes('|')) return 'table'
  if (/^```/.test(trimmed)) return 'code'
  if (/^[-*]\s|^\d+\.\s/.test(trimmed)) return 'list'
  if (/\$\$.*\$\$|\\\[.*\\\]/.test(trimmed)) return 'equation'
  return 'paragraph'
}

export function chunkDocument(
  text: string,
  options: ChunkingOptions = {}
): Chunk[] {
  const {
    maxTokens = 512,
    overlap = 64,
    respectBoundaries = true,
  } = options

  const lines = text.split('\n')
  const chunks: Chunk[] = []
  let currentContent = ''
  let currentType: Chunk['type'] = 'paragraph'
  let currentHeading = ''
  let blockStartLine = 0
  let chunkIndex = 0
  let inCodeBlock = false

  function flushChunk(endLine: number) {
    const content = currentContent.trim()
    if (!content) return

    const tokens = estimateTokens(content)

    // If chunk is too large, split it
    if (tokens > maxTokens && respectBoundaries) {
      const sentences = content.split(/(?<=[.!?])\s+/)
      let partial = ''
      let partialStartLine = blockStartLine

      for (const sentence of sentences) {
        const nextPartial = partial ? `${partial} ${sentence}` : sentence
        if (estimateTokens(nextPartial) > maxTokens && partial) {
          chunks.push({
            id: `chunk-${chunkIndex}`,
            content: partial.trim(),
            index: chunkIndex,
            tokens: estimateTokens(partial),
            type: currentType,
            metadata: {
              headingContext: currentHeading || undefined,
              startLine: partialStartLine,
              endLine,
            },
          })
          chunkIndex++
          // Overlap: keep last portion
          const words = partial.split(' ')
          const overlapWords = words.slice(-Math.ceil(overlap / 2))
          partial = overlapWords.join(' ') + ' ' + sentence
          partialStartLine = endLine
        } else {
          partial = nextPartial
        }
      }

      if (partial.trim()) {
        chunks.push({
          id: `chunk-${chunkIndex}`,
          content: partial.trim(),
          index: chunkIndex,
          tokens: estimateTokens(partial),
          type: currentType,
          metadata: {
            headingContext: currentHeading || undefined,
            startLine: partialStartLine,
            endLine,
          },
        })
        chunkIndex++
      }
    } else if (content) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        content,
        index: chunkIndex,
        tokens,
        type: currentType,
        metadata: {
          headingContext: currentHeading || undefined,
          startLine: blockStartLine,
          endLine,
        },
      })
      chunkIndex++
    }

    currentContent = ''
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        currentContent += line + '\n'
        inCodeBlock = false
        flushChunk(i)
        blockStartLine = i + 1
        continue
      } else {
        flushChunk(i - 1)
        inCodeBlock = true
        currentType = 'code'
        blockStartLine = i
        currentContent = line + '\n'
        continue
      }
    }

    if (inCodeBlock) {
      currentContent += line + '\n'
      continue
    }

    const blockType = detectBlockType(line)

    // Headings always start new chunks
    if (blockType === 'heading') {
      flushChunk(i - 1)
      currentHeading = line.replace(/^#{1,6}\s/, '').trim()
      currentType = 'heading'
      currentContent = line + '\n'
      blockStartLine = i
      flushChunk(i)
      blockStartLine = i + 1
      currentType = 'paragraph'
      continue
    }

    // Empty lines can be chunk boundaries
    if (line.trim() === '') {
      if (estimateTokens(currentContent) > maxTokens * 0.7) {
        flushChunk(i - 1)
        blockStartLine = i + 1
      } else {
        currentContent += '\n'
      }
      continue
    }

    // Type transitions start new chunks
    if (blockType !== currentType && currentContent.trim()) {
      flushChunk(i - 1)
      blockStartLine = i
      currentType = blockType
    }

    currentContent += line + '\n'

    // Check if current chunk exceeds max
    if (estimateTokens(currentContent) > maxTokens) {
      flushChunk(i)
      blockStartLine = i + 1
    }
  }

  // Flush remaining
  flushChunk(lines.length - 1)

  return chunks
}

export function getChunkingStats(chunks: Chunk[]) {
  const totalTokens = chunks.reduce((sum, c) => sum + c.tokens, 0)
  const typeBreakdown = chunks.reduce(
    (acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    totalChunks: chunks.length,
    totalTokens,
    avgTokensPerChunk: Math.round(totalTokens / chunks.length),
    typeBreakdown,
  }
}
