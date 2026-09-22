"use client"

import { useEffect, useRef, useState } from "react"
import { marcarCarregando, marcarPronto } from "@/lib/ready"
import { irProTopo, soltarScroll, travarScroll } from "@/lib/lenis"
import styles from "./Preloader.module.css"

/**
 * A tela que cobre o site enquanto ele carrega.
 *
 * Nada aparece e nada rola: uma régua atravessa a tela da esquerda pra
 * direita e o número grande anda junto com a ponta dela, contando até 100.
 * A régua fica a 88 do rodapé — a mesma altura da linha que corre acima
 * dos números na capa, então quando a tela sai a linha já está no lugar.
 *
 * O progresso é real, não uma animação de tempo fixo: ele sobe conforme as
 * fontes ficam prontas e o `load` da janela acontece. O que é inventado é
 * só o miolo — entre um marco e outro a barra continua andando devagar,
 * senão ela ficaria parada olhando pra cara da pessoa. Nunca passa de 95
 * antes de estar tudo pronto, e nunca volta atrás.
 *
 * Duas travas: um piso de 600ms, pra ela não piscar em conexão rápida, e
 * um teto de 6s, pra um recurso que nunca chega não prender o site.
 */

const PISO = 600
const TETO = 6000

/* Fora de qualquer efeito, de propósito: a marca tem que existir antes do
   primeiro `useEffect` da página rodar, senão os efeitos que esperam por
   ela acham que já podem começar. */
marcarCarregando()

export default function Preloader() {
  const [pct, setPct] = useState(0)
  const [saindo, setSaindo] = useState(false)
  const [fora, setFora] = useState(false)
  const alvo = useRef(0)

  useEffect(() => {
    const inicio = performance.now()
    let frame = 0
    let vivo = true

    /* Cada marco empurra o alvo. O `Math.max` é o que garante que a barra
       nunca ande pra trás quando dois marcos chegam fora de ordem. */
    const marco = (v: number) => {
      alvo.current = Math.max(alvo.current, v)
    }

    marco(8)
    if (document.readyState !== "loading") marco(25)
    document.fonts?.ready.then(() => marco(60))

    const imgs = Array.from(document.images)
    if (imgs.length) {
      let prontas = imgs.filter((i) => i.complete).length
      const passo = () => {
        prontas += 1
        marco(25 + (prontas / imgs.length) * 55)
      }
      imgs
        .filter((i) => !i.complete)
        .forEach((i) => {
          i.addEventListener("load", passo, { once: true })
          i.addEventListener("error", passo, { once: true })
        })
      marco(25 + (prontas / imgs.length) * 55)
    } else {
      marco(60)
    }

    let acabou = false
    const terminar = () => {
      acabou = true
      alvo.current = 100
    }
    if (document.readyState === "complete") terminar()
    else window.addEventListener("load", terminar, { once: true })
    const teto = window.setTimeout(terminar, TETO)

    /* O valor corrente mora num ref, não no estado: o efeito colateral de
       "chegou em 100, começa a sair" não pode viver dentro do updater do
       useState — em desenvolvimento o React chama o updater duas vezes e a
       saída seria agendada em dobro. */
    const atual = { v: 0 }

    const passo = () => {
      if (!vivo) return
      const t = performance.now() - inicio

      /* Enquanto não acabou, o alvo também sobe sozinho — devagar e com
         teto em 95. É o que impede a barra de travar num número enquanto
         espera um recurso lento. */
      if (!acabou) alvo.current = Math.max(alvo.current, Math.min(95, t / 28))

      const destino = acabou && t >= PISO ? 100 : Math.min(alvo.current, 95)
      // aproximação exponencial: rápida longe do alvo, macia perto dele
      atual.v =
        destino - atual.v < 0.4
          ? destino
          : atual.v + (destino - atual.v) * 0.08
      setPct(atual.v)

      if (atual.v >= 100) {
        window.setTimeout(() => setSaindo(true), 220)
        return
      }

      frame = requestAnimationFrame(passo)
    }
    frame = requestAnimationFrame(passo)

    return () => {
      vivo = false
      cancelAnimationFrame(frame)
      window.clearTimeout(teto)
      window.removeEventListener("load", terminar)
    }
  }, [])

  /* Trava a rolagem enquanto a tela está no ar. Só o eixo vertical: o
     `overflow-x: clip` da folha global tem que continuar valendo, senão o
     ticker inclinado volta a criar rolagem lateral.

     Quem impede o salto de ~15px quando a barra some e volta é o
     `scrollbar-gutter: stable` no html — sem ele a página inteira
     escorrega de lado no instante em que esta tela sai. */
  /* O `overflow` sozinho não segura o Lenis: ele escreve a posição por
     JS, e rolagem programática passa por cima de `overflow: hidden`.
     Medido antes desta trava: rodando a roda durante o carregamento, a
     página ia parar em 3.656px por baixo da tela, e saía no meio do
     site. Então as duas travas — a do CSS pra quem não tem Lenis, a do
     Lenis pra quem tem. */
  useEffect(() => {
    if (fora) return
    const html = document.documentElement
    const anterior = html.style.overflowY
    html.style.overflowY = "hidden"
    travarScroll()
    return () => {
      html.style.overflowY = anterior
      soltarScroll()
    }
  }, [fora])

  useEffect(() => {
    if (!saindo) return
    const t = window.setTimeout(() => {
      setFora(true)
      irProTopo()
      // agora sim: quem estava esperando pra animar pode começar
      marcarPronto()
    }, 620)
    return () => window.clearTimeout(t)
  }, [saindo])

  if (fora) return null

  const inteiro = Math.round(pct)

  return (
    <div
      data-preloader=""
      className={`${styles.screen} ${saindo ? styles.leaving : ""}`}
      role="progressbar"
      aria-label="Loading"
      aria-valuenow={inteiro}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* O número anda com a ponta da régua. A conta é a mesma do
          preenchimento, então os dois nunca se descolam. */}
      <div className={styles.track} style={{ ["--p" as string]: `${pct}%` }}>
        <span className={styles.counter}>
          {inteiro}
          <span className={styles.percent}>%</span>
        </span>
        <span className={styles.fill} />
      </div>
    </div>
  )
}
