"use client"

import { useMemo, type ReactNode } from "react"

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false
  const cells = trimmed.slice(1, -1).split("|")
  return cells.every((cell) => /^\s*:?-{2,}:?\s*$/.test(cell))
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith("|") && trimmed.endsWith("|")
}

function parseTableCells(line: string): string[] {
  const trimmed = line.trim()
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim())
}

function renderInline(str: string): ReactNode[] {
  // Process inline markdown: bold, inline code, links, citation refs
  // Order matters: code first (so ** inside code isn't processed), then links, then bold, then citations
  const tokens: ReactNode[] = []
  let key = 0

  // Regex to match: inline code, links, bold, citation refs
  const pattern =
    /(`[^`]+`)|(\[([^\]]+)\]\(([^)]+)\))|(\*\*[^*]+\*\*)|(\[\d+\])/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(str)) !== null) {
    // Push text before the match
    if (match.index > lastIndex) {
      tokens.push(<span key={key++}>{str.slice(lastIndex, match.index)}</span>)
    }

    if (match[1]) {
      // Inline code
      const code = match[1].slice(1, -1)
      tokens.push(
        <code
          key={key++}
          className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[0.85em] text-primary/90"
        >
          {code}
        </code>
      )
    } else if (match[2]) {
      // Link [text](url)
      const linkText = match[3]
      const url = match[4]
      tokens.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary/60"
        >
          {linkText}
        </a>
      )
    } else if (match[5]) {
      // Bold
      const boldText = match[5].slice(2, -2)
      tokens.push(
        <strong key={key++} className="font-semibold text-foreground">
          {boldText}
        </strong>
      )
    } else if (match[6]) {
      // Citation reference like [1], [2]
      const num = match[6].slice(1, -1)
      tokens.push(
        <sup
          key={key++}
          className="ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded bg-primary/20 px-1 text-[0.65rem] font-medium text-primary"
        >
          {num}
        </sup>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Push remaining text
  if (lastIndex < str.length) {
    tokens.push(<span key={key++}>{str.slice(lastIndex)}</span>)
  }

  return tokens.length > 0 ? tokens : [<span key={0}>{str}</span>]
}

export function MarkdownContent({ text }: { text: string }) {
  const rendered = useMemo(() => {
    const lines = text.split("\n")
    const elements: ReactNode[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // --- Code blocks (```) ---
      if (line.trim().startsWith("```")) {
        const lang = line.trim().slice(3).trim()
        const codeLines: string[] = []
        i++
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i])
          i++
        }
        // Skip closing ```
        if (i < lines.length) i++
        elements.push(
          <pre
            key={elements.length}
            className="my-1.5 overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-sm leading-relaxed"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        )
        continue
      }

      // --- Table blocks ---
      if (isTableRow(line)) {
        const tableLines: string[] = []
        while (i < lines.length && isTableRow(lines[i])) {
          tableLines.push(lines[i])
          i++
        }

        // Need at least 2 lines (header + separator or header + data)
        if (tableLines.length >= 2) {
          let headerRow: string[] | null = null
          let dataRows: string[][] = []

          // Check if second line is a separator
          if (tableLines.length >= 2 && isSeparatorRow(tableLines[1])) {
            headerRow = parseTableCells(tableLines[0])
            dataRows = tableLines.slice(2).map(parseTableCells)
          } else {
            // No separator row — treat all as data rows
            dataRows = tableLines.map(parseTableCells)
          }

          elements.push(
            <div
              key={elements.length}
              className="my-2 overflow-x-auto rounded-lg border border-white/10 backdrop-blur-sm"
            >
              <table className="w-full border-collapse text-sm">
                {headerRow && (
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      {headerRow.map((cell, ci) => (
                        <th
                          key={ci}
                          className="px-3 py-2 text-left font-semibold text-foreground"
                        >
                          {renderInline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {dataRows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-2 text-muted-foreground"
                        >
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        } else {
          // Single table-like line, just render as text
          elements.push(
            <div key={elements.length}>{renderInline(tableLines[0])}</div>
          )
        }
        continue
      }

      // --- Empty line ---
      if (line.trim() === "") {
        elements.push(<div key={elements.length} className="h-2" />)
        i++
        continue
      }

      // --- Headers ---
      if (line.trimStart().startsWith("### ")) {
        elements.push(
          <h3
            key={elements.length}
            className="mt-3 mb-1 text-base font-semibold text-foreground"
          >
            {renderInline(line.trimStart().slice(4))}
          </h3>
        )
        i++
        continue
      }

      if (line.trimStart().startsWith("## ")) {
        elements.push(
          <h2
            key={elements.length}
            className="mt-4 mb-1.5 text-lg font-bold text-foreground"
          >
            {renderInline(line.trimStart().slice(3))}
          </h2>
        )
        i++
        continue
      }

      if (line.trimStart().startsWith("# ")) {
        elements.push(
          <h1
            key={elements.length}
            className="mt-4 mb-2 text-xl font-bold text-foreground"
          >
            {renderInline(line.trimStart().slice(2))}
          </h1>
        )
        i++
        continue
      }

      // --- List items ---
      if (line.trimStart().startsWith("- ")) {
        const indent = line.length - line.trimStart().length
        elements.push(
          <div
            key={elements.length}
            className="flex gap-2"
            style={{ paddingLeft: indent > 0 ? indent * 4 : 0 }}
          >
            <span className="mt-1 shrink-0 text-primary">{"•"}</span>
            <span>{renderInline(line.trimStart().slice(2))}</span>
          </div>
        )
        i++
        continue
      }

      // --- Numbered list items ---
      const numberedMatch = line.trimStart().match(/^(\d+)\.\s+(.*)$/)
      if (numberedMatch) {
        const indent = line.length - line.trimStart().length
        elements.push(
          <div
            key={elements.length}
            className="flex gap-2"
            style={{ paddingLeft: indent > 0 ? indent * 4 : 0 }}
          >
            <span className="mt-0 shrink-0 text-primary/70">
              {numberedMatch[1]}.
            </span>
            <span>{renderInline(numberedMatch[2])}</span>
          </div>
        )
        i++
        continue
      }

      // --- Default: paragraph text ---
      elements.push(
        <div key={elements.length}>{renderInline(line)}</div>
      )
      i++
    }

    return elements
  }, [text])

  return <div className="flex flex-col gap-0.5">{rendered}</div>
}
