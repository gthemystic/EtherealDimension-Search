"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const parent = canvas.parentElement
    const resizeCanvas = () => {
      canvas.width = parent?.clientWidth || window.innerWidth
      canvas.height = parent?.clientHeight || window.innerHeight
    }
    resizeCanvas()

    let resizeObserver: ResizeObserver | undefined
    if (parent) {
      resizeObserver = new ResizeObserver(() => resizeCanvas())
      resizeObserver.observe(parent)
    }
    window.addEventListener("resize", resizeCanvas)

    const particleCount = 80
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
      })
    }

    let animationId: number
    const animate = () => {
      ctx.fillStyle = "rgba(11, 17, 32, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, i) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(96, 165, 250, 0.8)"
        ctx.fill()

        particles.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x
          const dy = particle.y - other.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(other.x, other.y)
            const opacity = (1 - distance / 120) * 0.3
            ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      resizeObserver?.disconnect()
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden rounded-none pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
