"use client"

import { useEffect, useState, type CSSProperties } from "react"
import Lottie from "lottie-react"

interface LottieAnimationProps {
  src?: string
  animationData?: object
  loop?: boolean
  autoplay?: boolean
  className?: string
  style?: CSSProperties
  fallback?: React.ReactNode
}

const cache = new Map<string, object>()

export function LottieAnimation({
  src,
  animationData,
  loop = true,
  autoplay = true,
  className,
  style,
  fallback,
}: LottieAnimationProps) {
  const [data, setData] = useState<object | null>(animationData || null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (animationData || !src) return

    if (cache.has(src)) {
      setData(cache.get(src)!)
      return
    }

    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((json) => {
        cache.set(src, json)
        setData(json)
      })
      .catch(() => setError(true))
  }, [src, animationData])

  if (error || (!data && !src)) {
    return fallback ? <>{fallback}</> : null
  }

  if (!data) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  )
}
