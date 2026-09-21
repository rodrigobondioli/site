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
 *
 * `lag` atrasa a largada: a peça precisa subir mais um tanto da janela
 * antes de começar. É o que desencontra uma grade inteira — três cards
 * lado a lado entram na tela juntos, mas não se revelam juntos.
 */

type Props = {
  children: ReactNode
  className?: string
  /** fração da altura da janela que a peça leva pra se revelar */
  span?: number
  /** deslocamento inicial da imagem, em px */
  shift?: number
  /** atraso da largada, em frações da altura da janela */
  lag?: number
}

export default function MaskReveal({
  children,
  className,
  span = 0.62,
  shift = 40,
  lag = 0,
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

    const progress = () => {
      const r = node.getBoundingClientRect()
      const h = window.innerHeight
      return Math.min(1, Math.max(0, (h - r.top - h * lag) / (h * span)))
    }

    // estado inicial: mascara quem ainda não começou a entrar
    const apply = (p: number) => {
      const e = 1 - Math.pow(1 - p, 3)
      node.style.clipPath = `inset(${((1 - e) * 100).toFixed(2)}% 0 0 0)`
      if (inner) {
        inner.style.transform = `translate3d(0, ${((1 - e) * -shift).toFixed(
          1
        )}px, 0)`
      }
    }
    apply(progress())

    const draw = () => {
      apply(progress())
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

    /* Uma janela inteira de folga de cada lado. Com margem pequena o
       IntersectionObserver avisava tarde num scroll rápido: quando o loop
       começava, o progresso já era 1 e a peça aparecia inteira de uma vez,
       sem máscara nenhuma. Agora o loop já está rodando quando ela entra. */
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "100% 0px 100% 0px" }
    )
    io.observe(node)

    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [span, shift, lag])

  /* Sem máscara no HTML de origem, de propósito.
     Se a peça nascesse mascarada e a pessoa recarregasse a página no meio
     dela, o JS calcularia progresso 1 no primeiro quadro e a imagem
     saltaria de invisível pra inteira — o "aparece do nada" que o Rodrigo
     viu. Quem põe a máscara é o efeito abaixo, e só em quem ainda não
     chegou a hora. Se o JS não rodar, a imagem simplesmente aparece. */
  return (
    <div className={className} ref={ref} style={{ willChange: "clip-path" }}>
      {children}
    </div>
  )
}
