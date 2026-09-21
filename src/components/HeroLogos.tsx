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
const DRIFT = 7        // px de balanço parado
const PUSH = 90        // deslocamento máximo
const SPRING = 0.12    // volta
const FRICTION = 0.78

type Bubble = { src: string; alt: string; x: number; y: number; rot: number }

/* Posições em % da área do hero, espelhando o espalhamento do Framer:
   bolhas de 104px, giradas em ângulos diferentes, algumas cortadas pela
   borda. Os ângulos são fixos (não sorteados) pra o que o servidor
   renderiza bater com o que o navegador monta. */
const BUBBLES: Bubble[] = [
  { src: "/logos/logo-harleydavidson.svg", alt: "Harley-Davidson", x: 8,  y: 10, rot: 14 },
  { src: "/logos/logo-cocacola.svg",       alt: "Coca-Cola",       x: 12, y: 20, rot: -12 },
  { src: "/logos/logo-unilever.svg",       alt: "Unilever",        x: 49, y: 13, rot: -6 },
  { src: "/logos/logo-vivo.svg",           alt: "Vivo",            x: 73, y: 8,  rot: 9 },
  { src: "/logos/logo-itau.svg",           alt: "Itaú",            x: 82, y: 27, rot: -10 },
  { src: "/logos/logo-nike.svg",           alt: "Nike",            x: 91, y: 57, rot: 12 },
  { src: "/logos/logo-loreal.svg",         alt: "L'Oréal",         x: 16, y: 72, rot: -8 },
  { src: "/logos/logo-havaianas.svg",      alt: "Havaianas",       x: 33, y: 79, rot: 11 },
  { src: "/logos/logo-cocacola.svg",       alt: "Coca-Cola",       x: 61, y: 75, rot: -16 },
]

export default function HeroLogos() {
  const host = useRef<HTMLDivElement>(null)
  const nodes = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return

    // fase e período próprios pra cada bolha: sem isso elas balançam juntas
    const state = BUBBLES.map((_, i) => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      phase: i * 1.7,
      period: 9 + (i % 4) * 2.5,
    }))
    const start = performance.now()
    let pointer = { x: -9999, y: -9999 }
    let frame = 0
    let running = false

    const tick = (now: number) => {
      const t = (now - start) / 1000
      state.forEach((s, i) => {
        const el = nodes.current[i]
        if (!el) return
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2 - s.x
        const cy = r.top + r.height / 2 - s.y
        const dx = cx - pointer.x
        const dy = cy - pointer.y
        const dist = Math.hypot(dx, dy)

        // deriva lenta, pra as bolhas nunca ficarem paradas
        let tx = Math.sin((t / s.period) * Math.PI * 2 + s.phase) * DRIFT
        let ty = Math.cos((t / (s.period * 1.3)) * Math.PI * 2 + s.phase) * DRIFT
        if (dist < RANGE && dist > 0.001) {
          const force = (1 - dist / RANGE) ** 2 * PUSH
          tx += (dx / dist) * force
          ty += (dy / dist) * force
        }

        s.vx = (s.vx + (tx - s.x) * SPRING) * FRICTION
        s.vy = (s.vy + (ty - s.y) * SPRING) * FRICTION
        s.x += s.vx
        s.y += s.vy

        el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`
      })

      frame = requestAnimationFrame(tick)
    }

    // só roda enquanto o hero está na tela
    const host = nodes.current[0]?.parentElement
    const startLoop = () => {
      if (running) return
      running = true
      frame = requestAnimationFrame(tick)
    }
    const stopLoop = () => {
      running = false
      cancelAnimationFrame(frame)
    }
    const io = host
      ? new IntersectionObserver(
          ([entry]) => (entry.isIntersecting ? startLoop() : stopLoop()),
          { threshold: 0 }
        )
      : null
    if (io && host) io.observe(host)
    else startLoop()

    const wake = () => startLoop()

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
      io?.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className={styles.field} ref={host} aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <div
          key={`${b.alt}-${b.x}`}
          className={styles.bubble}
          ref={(el) => {
            if (el) nodes.current[i] = el
          }}
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            rotate: `${b.rot}deg`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.src} alt="" />
        </div>
      ))}
    </div>
  )
}
