"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Revelação por máscara, de baixo pra cima, amarrada ao scroll.
 *
 * `clip-path: inset(P% 0 0 0)`: com P em 100 a caixa visível tem altura
 * zero encostada na base; conforme P cai, a área cresce da base pra cima.
 * É a máscara subindo — não a imagem entrando.
 *
 * A imagem ainda desce alguns pixels enquanto isso. Sem esse deslocamento
 * a máscara parece um rodo passando na tela; com ele, parece que a peça
 * está chegando.
 *
 * Curva easeOutCubic: sai rápido e assenta devagar no fim, como o Rodrigo
 * pediu. Linear ficaria mecânico.
 */

type Props = {
  children: ReactNode
  className?: string
  /** fração da altura da janela que a peça leva pra se revelar */
  span?: number
  /** deslocamento inicial da imagem, em px */
  shift?: number
}

export default function MaskReveal({
  children,
  className,
  span = 0.62,
  shift = 40,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const inner = node.firstElementChild as HTMLElement | null

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.clipPath = "none"
      if (inner) inner.style.transform = "none"
      return
    }

    let frame = 0
    let running = false

    const draw = () => {
      const r = node.getBoundingClientRect()
      const h = window.innerHeight
      // começa quando o topo da peça entra pela base da janela
      const p = Math.min(1, Math.max(0, (h - r.top) / (h * span)))
      const e = 1 - Math.pow(1 - p, 3)
      node.style.clipPath = `inset(${((1 - e) * 100).toFixed(2)}% 0 0 0)`
      if (inner) {
        inner.style.transform = `translate3d(0, ${((1 - e) * -shift).toFixed(
          1
        )}px, 0)`
      }
      frame = requestAnimationFrame(draw)
    }

    const start = () => {
      if (running) return
      running = true
      frame = requestAnimationFrame(draw)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "120px" }
    )
    io.observe(node)

    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [span, shift])

  return (
    <div
      className={className}
      ref={ref}
      style={{ clipPath: "inset(100% 0 0 0)", willChange: "clip-path" }}
    >
      {children}
    </div>
  )
}
