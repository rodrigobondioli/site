"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Revelação amarrada ao scroll — não é um "entrou, animou".
 *
 * Medi o que o Framer faz com a imagem do projeto em destaque: opacidade
 * 0 → 1, escala 0.90 → 1 e rotação -5° → 0, com o valor acompanhando a
 * posição da peça na tela o tempo todo. Se a pessoa sobe de novo, ele
 * desfaz. É isso que dá a sensação de peso, e é o que um
 * `transition: opacity .6s` disparado uma vez não entrega.
 *
 * Custo: um rAF só enquanto a peça está na tela. Fora dela, zero.
 */

type Props = {
  children: ReactNode
  className?: string
  /** quanto da altura da janela a peça leva pra se revelar por inteiro */
  span?: number
  opacity?: [number, number]
  scale?: [number, number]
  rotate?: [number, number]
}

export default function ScrollReveal({
  children,
  className,
  span = 0.85,
  opacity = [0, 1],
  scale = [0.9, 1],
  rotate = [-5, 0],
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.opacity = "1"
      return
    }

    let frame = 0
    let running = false

    const draw = () => {
      const r = node.getBoundingClientRect()
      const h = window.innerHeight
      // 0 quando o topo da peça está na base da janela; 1 quando subiu `span`
      const p = Math.min(1, Math.max(0, (h - r.top) / (h * span)))
      // easeOutCubic: o grosso do movimento acontece cedo
      const e = 1 - Math.pow(1 - p, 3)
      const lerp = (a: number, b: number) => a + (b - a) * e
      node.style.opacity = String(lerp(opacity[0], opacity[1]))
      node.style.transform = `scale(${lerp(scale[0], scale[1]).toFixed(
        4
      )}) rotate(${lerp(rotate[0], rotate[1]).toFixed(3)}deg)`
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
      { rootMargin: "100px" }
    )
    io.observe(node)

    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [span, opacity, scale, rotate])

  return (
    <div className={className} ref={ref} style={{ opacity: opacity[0] }}>
      {children}
    </div>
  )
}
