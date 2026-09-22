"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { aCadaQuadro } from "@/lib/lenis"

/**
 * Revelação amarrada ao scroll — não é um "entrou, animou".
 *
 * Medi o que o Framer faz com a imagem do projeto em destaque: opacidade
 * 0 → 1, escala 0.90 → 1 e rotação -5° → 0, com o valor acompanhando a
 * posição da peça na tela o tempo todo. Se a pessoa sobe de novo, ele
 * desfaz. É isso que dá a sensação de peso, e é o que um
 * `transition: opacity .6s` disparado uma vez não entrega.
 *
 * Custo: um passo no compasso do site (src/lib/lenis.ts) enquanto a peça
 * está perto da tela. Fora dela, zero.
 *
 * As três armadilhas abaixo são as mesmas que o MaskReveal levou — este
 * aqui ficou pra trás na correção, e por isso repetiu o bug de "às vezes
 * aparece inteira de uma vez".
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

  /* Desmontados em números: um array literal é uma referência nova a cada
     render, então passá-lo na lista de dependências refaz o observer
     toda vez. Com primitivos o efeito roda uma vez e fica. */
  const [o0, o1] = opacity
  const [s0, s1] = scale
  const [r0, r1] = rotate

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.opacity = "1"
      return
    }

    let desligar: (() => void) | null = null

    const draw = () => {
      const r = node.getBoundingClientRect()
      const h = window.innerHeight
      // 0 quando o topo da peça está na base da janela; 1 quando subiu `span`
      const p = Math.min(1, Math.max(0, (h - r.top) / (h * span)))
      // easeOutCubic: o grosso do movimento acontece cedo
      const e = 1 - Math.pow(1 - p, 3)
      const lerp = (a: number, b: number) => a + (b - a) * e
      node.style.opacity = String(lerp(o0, o1))
      node.style.transform = `scale(${lerp(s0, s1).toFixed(4)}) rotate(${lerp(
        r0,
        r1
      ).toFixed(3)}deg)`
    }

    // estado inicial aplicado pelo JS, não pelo HTML — ver o comentário
    // no JSX lá embaixo
    draw()

    const start = () => {
      if (desligar) return
      desligar = aCadaQuadro(draw)
    }
    const stop = () => {
      desligar?.()
      desligar = null
    }

    /* Uma janela inteira de folga de cada lado. Com 100px o observer
       avisava tarde num scroll rápido: quando o loop começava, o progresso
       já era 1 e a peça aparecia pronta, sem revelação nenhuma. */
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "100% 0px 100% 0px" }
    )
    io.observe(node)

    return () => {
      io.disconnect()
      stop()
    }
  }, [span, o0, o1, s0, s1, r0, r1])

  /* Nasce visível, de propósito. Se a peça nascesse apagada e a pessoa
     recarregasse a página no meio dela, o JS calcularia progresso 1 no
     primeiro quadro e ela saltaria de invisível pra inteira. Quem aplica o
     estado inicial é o efeito acima, e só em quem ainda não chegou a hora.
     Se o JS não rodar, a peça simplesmente aparece. */
  return (
    <div className={className} ref={ref} style={{ willChange: "opacity, transform" }}>
      {children}
    </div>
  )
}
