"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface MorphingTextProps {
  texts: string[]
  interval?: number
  className?: string
}

export function MorphingText({ texts, interval = 3000, className }: MorphingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayText, setDisplayText] = useState(texts[0])

  const morph = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % texts.length
        setDisplayText(texts[next])
        return next
      })
      setTimeout(() => setIsAnimating(false), 400)
    }, 400)
  }, [texts])

  useEffect(() => {
    const timer = setInterval(morph, interval)
    return () => clearInterval(timer)
  }, [morph, interval])

  return (
    <span
      className={cn(
        "inline-block transition-all duration-400",
        isAnimating ? "opacity-0 blur-sm scale-95 translate-y-1" : "opacity-100 blur-0 scale-100 translate-y-0",
        className
      )}
    >
      {displayText}
    </span>
  )
}
