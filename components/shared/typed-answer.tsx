"use client"

import { useState, useEffect } from "react"
import { MarkdownContent } from "./markdown-content"

export function TypedAnswer({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedLength, setDisplayedLength] = useState(0)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (isDone) return
    const totalLength = text.length
    const charsPerTick = Math.max(3, Math.floor(totalLength / 60))
    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = prev + charsPerTick
        if (next >= totalLength) {
          clearInterval(interval)
          setIsDone(true)
          onComplete?.()
          return totalLength
        }
        return next
      })
    }, 20)
    return () => clearInterval(interval)
  }, [text, isDone, onComplete])

  const visible = isDone ? text : text.slice(0, displayedLength)

  return (
    <div className="text-sm text-foreground/90 leading-relaxed">
      <MarkdownContent text={visible} />
      {!isDone && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/60 animate-pulse rounded-sm align-text-bottom" />
      )}
    </div>
  )
}
