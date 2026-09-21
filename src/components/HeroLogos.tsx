"use client"

import { useEffect, useRef } from "react"
import styles from "./HeroLogos.module.css"

/**
 * As bolhas de logo do hero. Porta o CursorAttractFixed do Framer:
 * direction="repel", intensity 100, range 300.
 *
 * Cada bolha guarda seu deslocamento e volta pro lugar por mola. O loop
 * só roda enquanto alguma bolha está fora de posição — parado, custa zero.
 */

const RANGE = 300      // px de alcance do cursor
const PUSH = 90        // deslocamento máximo
const SPRING = 0.12    // volta
const FRICTION = 0.78

type Bubble = { src: string; alt: string; x: number; y: number; size: number }

// x/y em % da área do hero. Espalhadas em volta do título, como no Framer.
const BUBBLES: Bubble[] = [
  { src: "/logos/logo-cocacola.svg",      alt: "Coca-Cola",       x: 12,  y: 20, size: 104 },
  { src: "/logos/logo-itau.svg",          alt: "Itaú",            x: 83,  y: 28, size: 96  },
  { src: "/logos/logo-nike.svg",          alt: "Nike",            x: 92,  y: 58, size: 104 },
  { src: "/logos/logo-harleydavidson.svg", alt: "Harley-Davidson", x: 74, y: 10, size: 88 },
  { src: "/logos/logo-loreal.svg",        alt: "L'Oréal",         x: 16,  y: 74, size: 96  },
  { src: "/logos/logo-havaianas.svg",     alt: "Havaianas",       x: 33,  y: 80, size: 88  },
  { src: "/logos/logo-vivo.svg",          alt: "Vivo",            x: 62,  y: 76, size: 96  },
  { src: "/logos/logo-unilever.svg",      alt: "Unilever",        x: 50,  y: 14, size: 80  },
]

export default function HeroLogos() {
  const host = useRef<HTMLDivElement>(null)
  const nodes = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return

    const state = BUBBLES.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }))
    let pointer = { x: -9999, y: -9999 }
    let frame = 0
    let running = false

    const tick = () => {
      let moving = false
      state.forEach((s, i) => {
        const el = nodes.current[i]
        if (!el) return
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2 - s.x
        const cy = r.top + r.height / 2 - s.y
        const dx = cx - pointer.x
        const dy = cy - pointer.y
        const dist = Math.hypot(dx, dy)

        let tx = 0
        let ty = 0
        if (dist < RANGE && dist > 0.001) {
          const force = (1 - dist / RANGE) ** 2 * PUSH
          tx = (dx / dist) * force
          ty = (dy / dist) * force
        }

        s.vx = (s.vx + (tx - s.x) * SPRING) * FRICTION
        s.vy = (s.vy + (ty - s.y) * SPRING) * FRICTION
        s.x += s.vx
        s.y += s.vy

        if (Math.abs(s.x) > 0.1 || Math.abs(s.y) > 0.1 || Math.abs(s.vx) > 0.1) moving = true
        el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`
      })

      if (moving) {
        frame = requestAnimationFrame(tick)
      } else {
        running = false
      }
    }

    const wake = () => {
      if (!running) {
        running = true
        frame = requestAnimationFrame(tick)
      }
    }

    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY }
      wake()
    }
    const onLeave = () => {
      pointer = { x: -9999, y: -9999 }
      wake()
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerleave", onLeave)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerleave", onLeave)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className={styles.field} ref={host} aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <div
          key={b.alt}
          className={styles.bubble}
          ref={(el) => {
            if (el) nodes.current[i] = el
          }}
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.src} alt="" width={b.size * 0.46} height={b.size * 0.46} />
        </div>
      ))}
    </div>
  )
}
