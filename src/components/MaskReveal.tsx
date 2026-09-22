"use client"

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { aCadaQuadro } from "@/lib/lenis"

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
  style?: CSSProperties
}

export default function MaskReveal({
  children,
  className,
  span = 0.62,
  shift = 40,
  lag = 0,
  style,
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

    let desligar: (() => void) | null = null

    /* A porta: 0 enquanto a imagem não tem pixels, 1 depois que ela pode
       ser pintada. O que vai pra tela é o MENOR entre o progresso do
       scroll e a porta.

       É o conserto do "fica tudo branco e de repente a imagem aparece".
       A caixa tem largura e altura declaradas, então ela existe antes da
       imagem chegar — e a máscara abria sobre uma caixa vazia. A pessoa
       via a revelação acontecer no nada, e quando os bytes chegavam a
       imagem surgia inteira, de uma vez, com a máscara já terminada.
       São 40MB de PNG no site; no 4G isso é um segundo ou dois.

       Com a porta, a peça fica mascarada (não branca) até ter o que
       mostrar, e aí a revelação acontece com pixels de verdade — que é o
       ponto do efeito. */
    const img = node.querySelector("img")
    let porta = !img || img.complete ? 1 : 0
    let abriuEm = 0
    let prazo = 0

    const liberar = () => {
      if (porta === 1 || abriuEm) return
      /* Se a imagem chegou depois da hora, a porta abre em 450ms e a
         revelação acontece agora. Se chegou a tempo, o scroll manda
         sozinho e nada disso se nota. */
      abriuEm = performance.now()
    }

    if (img && !img.complete) {
      img.addEventListener("load", liberar, { once: true })
      // erro também libera: imagem quebrada não pode prender a caixa vazia
      img.addEventListener("error", liberar, { once: true })
    }

    const progress = () => {
      const r = node.getBoundingClientRect()
      const h = window.innerHeight
      return Math.min(1, Math.max(0, (h - r.top - h * lag) / (h * span)))
    }

    /* O quanto a porta já abriu neste quadro. */
    const portaAgora = () => {
      if (porta === 1) return 1
      if (!abriuEm) return 0
      const t = (performance.now() - abriuEm) / 450
      if (t >= 1) { porta = 1; return 1 }
      return t
    }

    const valor = () => Math.min(progress(), portaAgora())

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
    apply(valor())

    let desenhou = false
    const draw = () => {
      apply(valor())
      desenhou = true
    }

    /* Rede de segurança. `apply` acima já escreveu a máscara no nó; se o
       laço nunca rodar — observer que não disparou, aba que entrou em
       segundo plano no momento errado, JS que morreu no meio — essa
       máscara fica lá e a peça some. Sem animação é aceitável; invisível
       pra sempre não é. */
    const rede = window.setTimeout(() => {
      if (desenhou) return
      node.style.clipPath = "none"
      if (inner) inner.style.transform = "none"
    }, 2500)

    const start = () => {
      if (desligar) return

      /* A peça está a menos de uma janela daqui, mas a imagem é
         `loading="lazy"` e quem decide a hora do fetch é o navegador — que
         adia em aba de segundo plano, em conexão ruim, e às vezes só
         adia. Como a porta abaixo espera essa imagem, esse adiamento
         virava card invisível pra sempre. Aqui a gente para de esperar e
         pede: trocar pra "eager" dispara o carregamento na hora. */
      if (img && !img.complete) {
        if (img.loading === "lazy") img.loading = "eager"
        /* E, aconteça o que acontecer com a imagem, a porta abre em 1,2s.
           Uma porta sem teto não é uma porta, é uma parede. */
        if (!prazo) prazo = window.setTimeout(liberar, 1200)
      }

      desligar = aCadaQuadro(draw)
    }
    const stop = () => {
      desligar?.()
      desligar = null
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
      stop()
      clearTimeout(rede)
      if (prazo) clearTimeout(prazo)
      if (img) {
        img.removeEventListener("load", liberar)
        img.removeEventListener("error", liberar)
      }
    }
  }, [span, shift, lag])

  /* Sem máscara no HTML de origem, de propósito.
     Se a peça nascesse mascarada e a pessoa recarregasse a página no meio
     dela, o JS calcularia progresso 1 no primeiro quadro e a imagem
     saltaria de invisível pra inteira — o "aparece do nada" que o Rodrigo
     viu. Quem põe a máscara é o efeito abaixo, e só em quem ainda não
     chegou a hora. Se o JS não rodar, a imagem simplesmente aparece. */
  return (
    <div className={className} ref={ref} style={{ ...style, willChange: "clip-path" }}>
      {children}
    </div>
  )
}
