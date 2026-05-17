export function fireConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#f59e0b', '#ec4899', '#06b6d4']
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 100,
    w: 8 + Math.random() * 8,
    h: 4 + Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    vr: (Math.random() - 0.5) * 0.2,
    opacity: 1,
  }))

  let frame
  const start = performance.now()

  function draw(now) {
    const elapsed = (now - start) / 1000
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let alive = false
    for (const p of pieces) {
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.vy += 0.08
      if (elapsed > 2) p.opacity -= 0.018
      if (p.opacity > 0 && p.y < canvas.height + 20) {
        alive = true
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
    }

    if (alive && elapsed < 5) {
      frame = requestAnimationFrame(draw)
    } else {
      cancelAnimationFrame(frame)
      canvas.remove()
    }
  }

  frame = requestAnimationFrame(draw)
}
