import { useEffect, useRef } from 'react'

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#22C55E', '#3B82F6']

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 80 }, () => ({
      x:    Math.random() * canvas.width,
      y:    -20,
      vy:   Math.random() * 4 + 3,
      vx:   (Math.random() - 0.5) * 4,
      size: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
    }))

    let frame: number
    const startTime = Date.now()

    function draw() {
      const elapsed = Date.now() - startTime
      if (elapsed > 1200) { cancelAnimationFrame(frame); return }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.y  += p.vy
        p.x  += p.vx
        p.rotation += p.rotSpeed
        p.opacity = Math.max(0, 1 - elapsed / 1200)

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.fillStyle   = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
        ctx.restore()
      }
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  )
}
